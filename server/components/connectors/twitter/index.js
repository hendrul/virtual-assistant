const debug = require("debug")("app:bot:twitter");
const twitterbot = require("./TwitterBot");

var storage = require("../../storage");
const watsonMiddleware = require("../../watson-middleware");

const CONNECTOR_TYPE = "twitter";

const defaultOptions = {
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
  defaultOptions.storage = storage.cloudant;
} else {
  defaultOptions.json_file_store = __dirname + "/.data/db/"; // store user data in a simple JSON format
}

class TwitterConnector {
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
      this.options.access_token_secret &&
      this.options.consumer_key &&
      this.options.consumer_secret
    );
  }

  init() {
    if (this.enabled) {
      Object.assign(this, twitterbot(this.options));
      if (typeof this.before === "function") {
        this.nextBefore = watsonMiddleware.before;
        watsonMiddleware.before = this.before.bind(this);
      }
      this.setupMessageReceive();
      const bot = this.spawn();
      this.createWebhookEndpoints(this.webserver, bot);
    } else {
      console.log(
        "Twitter connector disabled. To enable add twitter required configuration in .env"
      );
    }
  }

  before(message, payload, callback) {
    if (!(payload.context && payload.context.connector_type)) {
      payload.context = Object.assign({}, payload.context, {
        connector_type: CONNECTOR_TYPE
      });
    }
    this.nextBefore(message, payload, callback);
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
          (err, resp) => {}
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
            .then(() => {});
        }
      }
    });
  }
}
module.exports = TwitterConnector;
