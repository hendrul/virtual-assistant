const debug = require("debug")("app:bot:whatsapp");
const whatsappbot = require("./WhatsappBot");

var storage = require("../../storage");
const watsonMiddleware = require("../../watson-middleware");

const bot_options = {
  stats_optout: true,
  apikey: process.env.WHATSAPP_API_KEY,
  number: process.env.WHATSAPP_NUMBER,
  debug: true
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

const controller = whatsappbot(bot_options);

controller.init = function(webserver, httpserver) {
  setupMessageReceive(controller);
  const bot = controller.spawn();
  controller.createWebhookEndpoints(webserver, bot);
};

module.exports = controller;
