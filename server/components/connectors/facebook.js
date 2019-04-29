const debug = require("debug")("app:bot:facebook");
const Botkit = require("botkit");

var storage = require("../storage");
const watsonMiddleware = require("../watson-middleware");

const defaultOptions = {
  stats_optout: true,
  access_token: process.env.FACEBOOK_PAGE_TOKEN,
  verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
  app_secret: process.env.FACEBOOK_APP_SECRET
};

// Use cloudant database if specified, otherwise store in a JSON file local to the app.
if (storage.cloudant) {
  defaultOptions.storage = storage.cloudant;
} else {
  defaultOptions.json_file_store = __dirname + "/.data/db/"; // store user data in a simple JSON format
}

class FacebookConnector {
  constructor(webserver, httpserver, httpsserver, socket, options) {
    options = Object.assign({}, defaultOptions, options);
    Object.assign(this, {
      webserver,
      httpserver,
      httpsserver,
      socket,
      options
    });
  }

  get enabled() {
    return (
      this.options.access_token &&
      this.options.verify_token &&
      this.options.app_secret
    );
  }

  init() {
    if (this.enabled) {
      Object.assign(this, Botkit.facebookbot(this.options));
      this.setupMessageReceive();
      const bot = this.spawn();
      this.createWebhookEndpoints(webserver, bot);
    } else {
      console.log(
        "Facebook connector disabled. To enable add facebook required configuration in .env"
      );
    }
  }

  setupMessageReceive() {
    this.middleware.receive.use((bot, message, next) => {
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
          var replies = responses.map(resp => {
            switch (resp.response_type) {
              case "text":
                var text = [].concat(resp.text);
                var digressed = ((message.context || {}).system || {})
                  .digressed;
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
            .then(() => {})
            .catch(err => {
              console.error(err);
            });
        }
      }
    });
  }
}

module.exports = FacebookConnector;
