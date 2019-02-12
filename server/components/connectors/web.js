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

var bot_options = {
  replyWithTyping: true,
  stats_optout: true
};

// Use cloudant database if specified, otherwise store in a JSON file local to the app.
if (storage.cloudant) {
  bot_options.storage = storage.cloudant;
} else {
  bot_options.json_file_store = __dirname + "/.data/db/"; // store user data in a simple JSON format
}

function setupMessageReceive(controller) {
  controller.middleware.receive.use(function(bot, message, next) {
    watsonMiddleware.receive(bot, message, next);
  });
  controller.on(["message_received", "welcome"], function(bot, message) {
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
        var replies = message.watsonData.output.generic.map(function(resp) {
          switch (resp.response_type) {
            case "text":
              var text = [].concat(resp.text);
              var digressed = ((message.context || {}).system || {}).digressed;
              return digressed ? text[0] : text.join("\n");
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
                quick_replies: resp.options.map(function(option) {
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

function setupMessageHistory(controller) {
  if (controller.storage && controller.storage.history) {
    // expose history as an endpoint
    controller.webserver.post("/botkit/history", function(req, res) {
      if (req.body.user) {
        controller.storage.history
          .getHistoryForUser(req.body.user, 10)
          .then(function(history) {
            res.json({
              success: true,
              history: history.map(function(h) {
                return h.message;
              })
            });
          })
          .catch(function(err) {
            res.json({ success: false, history: [], error: err });
          });
      } else {
        res.json({ success: false, history: [], error: "no user specified" });
      }
    });

    function logMessage(message) {
      if (message.type == "message" || message.type == "message_received") {
        controller.storage.history
          .addToHistory(message, message.user)
          .catch(function(err) {
            console.error("Error storing history: ", err);
          });
      }
    }

    // log incoming messages to the user history
    controller.middleware.receive.use(function(bot, message, next) {
      controller.storage.users.get(message.user, function(err, user) {
        logMessage(message, user);
      });
      next();
    });

    controller.middleware.format.use(function(
      bot,
      message,
      platform_message,
      next
    ) {
      controller.storage.users.get(message.to, function(err, user) {
        logMessage(platform_message, user);
      });
      next();
    });
  } else {
    console.log("Configure a MONGO_URI to enable message history");
    controller.webserver.post("/botkit/history", function(req, res) {
      res.json({ success: true, history: [] });
    });
  }
}

// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.socketbot(bot_options);

controller.init = function(webserver, httpserver) {
  setupMessageHistory(controller);
  setupMessageReceive(controller);

  // Open the web socket server
  controller.openSocketServer(httpserver);

  // Start the bot brain in motion!!
  controller.startTicking();
};

module.exports = controller;
