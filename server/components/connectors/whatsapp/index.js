const debug = require("debug")("app:bot:whatsapp");
const whatsappbot = require("./WhatsappBot");
// const nock = require("nock");
var storage = require("../../storage");
const watsonMiddleware = require("../../watson-middleware");

const defaultOptions = {
  stats_optout: true,
  apikey: process.env.WHATSAPP_API_KEY,
  number: process.env.WHATSAPP_NUMBER,
  whitelist: process.env.WHATSAPP_WHITELIST,
  debug: true
};

// Use cloudant database if specified, otherwise store in a JSON file local to the app.
if (storage.cloudant) {
  defaultOptions.storage = storage.cloudant;
} else {
  defaultOptions.json_file_store = __dirname + "/.data/db/"; // store user data in a simple JSON format
}

class WhatsappConnector {
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
    return this.options.apikey && this.options.number;
  }

  init() {
    if (this.enabled) {
      const controller = whatsappbot(this.options);
      Object.assign(this, controller);
      this.setupMessageHistory();
      this.setupMessageReceive();
      const bot = controller.spawn();
      this.createWebhookEndpoints(this.webserver, bot);

      var socket = (global.socket = require("socket.io-client")(
        `ws://${process.env.TRUDESK_HOST}?token=${
          process.env.TRUDESK_APIKEY_FULANO
        }`
      ));

      socket.on("chatMessage", data => {
        if (data.from !== process.env.TRUDESK_USER_FULANO) {
          let message = {
            type: "message_received",
            user: process.env.WHATSAPP_FULANO_NUMBER,
            channel: process.env.WHATSAPP_FULANO_NUMBER,
            text: data.message,
            raw_message: data
          };
          bot.say(message);
        }
      });
    } else {
      console.log(
        "Whatsapp connector disabled. To enable add whatsapp required configuration in .env"
      );
    }
  }

  setupMessageReceive() {
    this.middleware.receive.use(function(bot, message, next) {
      watsonMiddleware.receive(bot, message, next);
    });
    this.on(["message_received", "welcome"], function(bot, message) {
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
          var replies = responses.map(function(resp) {
            switch (resp.response_type) {
              case "text":
                var text = [].concat(resp.text);
                var digressed = ((message.context || {}).system || {})
                  .digressed;
                return digressed ? text[0] : text.join("\n");
              case "option":
                throw new Error("Quick replies not supported");
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
                throw new Error("Pause not supported");
              default:
                return "Perdona tengo un problema en estos momentos, no puedo darte una respuesta coherente";
            }
          });

          replies
            .reduce(function(p, reply) {
              return p.then(function() {
                return new Promise(function(resolve, reject) {
                  bot.reply(message, reply, function(err) {
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

  setupMessageHistory() {
    if (this.storage && this.storage.history) {
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
  logMessage(message) {
    if (message.type == "message" || message.type == "message_received") {
      this.storage.history.addToHistory(message, message.user).catch(err => {
        console.error("Error storing history: ", err);
      });
    }
  }
}

module.exports = WhatsappConnector;
