const debug = require("debug")("app:bot:twitter");
const twitterbot = require("./TwitterBot");

var storage = require("../../storage");
const watsonMiddleware = require("../../watson-middleware");

const bot_options = {
  stats_optout: true,
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: false, // optional - requires SSL certificates to be valid.
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

const controller = twitterbot(bot_options);

controller.init = function(webserver, httpserver) {
  setupMessageReceive(controller);
  const bot = controller.spawn();
  controller.createWebhookEndpoints(webserver, bot);
};

module.exports = controller;
