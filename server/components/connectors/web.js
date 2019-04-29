/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
var debug = require("debug")("app:bot:web");
var Botkit = require("botkit");

var storage = require("../storage");
const watsonMiddleware = require("../watson-middleware");

var defaultOptions = {
  replyWithTyping: true,
  stats_optout: true
};

// Use cloudant database if specified, otherwise store in a JSON file local to the app.
if (storage.cloudant) {
  defaultOptions.storage = storage.cloudant;
} else {
  defaultOptions.json_file_store = __dirname + "/.data/db/"; // store user data in a simple JSON format
}

class WebConnector {
  constructor(webserver, httpserver, httpsserver, options) {
    options = Object.assign({}, defaultOptions, options);
    Object.assign(this, {
      webserver,
      httpserver,
      httpsserver,
      options
    });
  }

  get enabled() {
    return true;
  }

  init() {
    if (this.enabled) {
      Object.assign(this, Botkit.socketbot(this.options));
      this.setupMessageHistory();
      this.setupMessageReceive();

      // Open the web socket server
      if (this.httpserver) {
        this.openSocketServer(this.httpserver);
      }
      if (this.httpsserver) {
        this.openSocketServer(this.httpsserver);
      }
      // Start the bot brain in motion!!
      this.startTicking();
    } else {
      console.log("Web connector disabled!");
    }
  }

  setupMessageHistory() {
    if (this.storage && this.storage.history) {
      // expose history as an endpoint
      this.webserver.post("/botkit/history", (req, res) => {
        if (req.body.user) {
          this.storage.history
            .getHistoryForUser(req.body.user, 10)
            .then(history => {
              res.json({
                success: true,
                history: history.map(h => {
                  return h.message;
                })
              });
            })
            .catch(err => {
              res.json({ success: false, history: [], error: err });
            });
        } else {
          res.json({ success: false, history: [], error: "no user specified" });
        }
      });

      // log incoming messages to the user history
      this.middleware.receive.use((bot, message, next) => {
        this.storage.users.get(message.user, (err, user) => {
          this.logMessage(message, user);
        });
        next();
      });

      this.middleware.format.use((bot, message, platform_message, next) => {
        this.storage.users.get(message.to, (err, user) => {
          this.logMessage(platform_message, user);
        });
        next();
      });
    } else {
      console.log("Configure a MONGO_URI to enable message history");
      this.webserver.post("/botkit/history", (req, res) => {
        res.json({ success: true, history: [] });
      });
    }
  }

  setupMessageReceive() {
    this.middleware.receive.use((bot, message, next) => {
      watsonMiddleware.receive(bot, message, next);
    });
    this.on(["message_received", "welcome"], (bot, message) => {
      if (message.watsonError) {
        bot.reply(
          message,
          "Algo ha ido mal!, no tengo una respuesta, disculpa!",
          function(err, resp) {}
        );
      } else {
        /* Informacion sobre los formatos de tipos de respuesta de watson assistant
         * ver "implementing responses" en la documentación de watson assistant
         * https://console.bluemix.net/docs/services/conversation/implement-responses.html
         * Informacion sobre los formatos de tipos de respuesta que acepta botkit ver
         * "Botkit Web Connector" https://botkit.ai/docs/readme-web.html
         */
        if (message.watsonData && message.watsonData.output.generic) {
          var output = message.watsonData.output;
          var responses = (output.dynamic || {}).generic || output.generic;
          var replies = responses.map(resp => {
            switch (resp.response_type) {
              case "text":
                var text = [].concat(resp.text);
                var digressed = ((message.context || {}).system || {})
                  .digressed;
                return digressed ? text[0] : text.join("<br>");
              case "option":
                return {
                  text:
                    resp.title.trim() +
                    (resp.title
                      .trim()
                      .slice(-1)
                      .match(/\w/)
                      ? "."
                      : "") +
                    " " +
                    resp.description,
                  quick_replies: resp.options.map(option => {
                    return {
                      title: option.label,
                      payload: option.value.input.text
                    };
                  })
                };
              case "image":
                return {
                  text: resp.title,
                  files: [
                    {
                      url: resp.source,
                      image: true
                    }
                  ]
                };
              case "pause":
                return {
                  typing: false,
                  typingDelay: resp.time
                };
              default:
                return "Perdona tengo un problema en estos momentos, no puedo darte una respuesta coherente";
            }
          });

          replies
            .reduce((p, reply) => {
              return p.then(() => {
                return new Promise((resolve, reject) => {
                  bot.reply(message, reply, err => {
                    if (err) reject(new Error(err));
                    else resolve();
                  });
                });
              });
            }, Promise.resolve())
            .then(function() {});
        }
      }
    });
  }

  logMessage(message) {
    if (message.type == "message" || message.type == "message_received") {
      this.storage.history.addToHistory(message, message.user).catch(err => {
        console.error("Error storing history: ", err);
      });
    }
  }
}

module.exports = WebConnector;
