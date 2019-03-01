const request = require("request");
const CoreBot = require("botkit").core;
var qs = require("querystring");
var url = require("url");

function WhatsappBot(configuration) {
  // Create a core botkit bot
  const whatsapp_botkit = CoreBot(configuration || {});

  whatsapp_botkit.middleware.spawn.use(function(bot, next) {
    next();
  });

  whatsapp_botkit.middleware.normalize.use(function(bot, message, next) {
    message.type = "message_received";
    next();
  });

  whatsapp_botkit.middleware.normalize.use(function(bot, message, next) {
    // capture the user ID
    message.user = message.from;
    // FIX: Whatsapp tiene canal 1:1 entre los usuarios?
    message.channel = message.user;
    next();
  });

  whatsapp_botkit.middleware.format.use(function(
    bot,
    message,
    platform_message,
    next
  ) {
    platform_message.number = whatsapp_botkit.config.number;
    if (isMediaUrl(message.text)) {
    } else {
      platform_message.text = message.text;
    }
    next();
  });

  whatsapp_botkit.createWebhookEndpoints = function(webserver, bot, cb) {
    whatsapp_botkit.log(
      // prettier-ignore
      "** Serving webhook endpoints for Whatsapp Account Activity API at: " +
        "http://" + whatsapp_botkit.config.hostname + ":" + whatsapp_botkit.config.port + "/whatsapp/receive"
    );

    /**
     * Receives Account Activity events
     **/
    webserver.post("/whatsapp/receive", function(request, response) {
      whatsapp_botkit.ingest(bot, request.body, response);
      response.send("200 OK");
    });

    return whatsapp_botkit;
  };

  function isMediaUrl(text) {
    const mediaUrl = url.parse(text);
    return mediaUrl.protocol && mediaUrl.path;
  }

  function getResultMessage(code) {
    switch (code) {
      case 0:
        return "Message queued";
      case -1:
        return "Invalid apikey";
      case -2:
        return "Missing parameters";
      case -3:
        return "You cannot send messages to this number because it has never written to you. You are using a TRIAL NUMBER";
      case -5:
        return "You cannot send more messages to this number";
      case -6:
        return "Your Apikey is not ready yet";
      case -8:
        return "You must encode text parameter as UTF-8";
      case -9:
        return "You cannot send a message to yourself";
      case -10:
        return "No credit";
      case -11:
        return "You cannot queue more than 20000 current messages in this number";
    }
  }

  whatsapp_botkit.defineBot(function(botkit, config) {
    var bot = {
      type: "wa",
      botkit: botkit,
      config: config || {},
      utterances: botkit.utterances
    };

    bot.send = function(msg, cb) {
      const { apikey } = whatsapp_botkit.config;

      // construct request to send a Direct Message
      request.get(
        {
          json: true,
          url:
            "https://panel.apiwha.com/send_message.php" +
            qs.stringify({
              apikey: apikey,
              number: msg.number,
              text: msg.text
            })
        },
        function(err, response, body) {
          if (err) {
            botkit.debug("WEBHOOK ERROR", err);
            return cb && cb(err);
          }
          if (body.result_code < 0) {
            botkit.debug("API ERROR: " + getResultMessage(body.result_code));
            return cb && cb({ error: getResultMessage(body.result_code) });
          }
          botkit.debug("WEBHOOK SUCCESS", body);
          cb && cb(null, body);
        }
      );
    };

    bot.reply = function(src, resp, cb) {
      var msg = {};
      if (typeof resp == "string") {
        msg.text = resp;
      } else {
        msg = resp;
      }

      msg.channel = src.channel;
      msg.to = src.user;

      bot.say(msg, cb);
    };

    bot.findConversation = function(message, cb) {
      botkit.debug("DEFAULT FIND CONVO");
      cb(null);
    };

    return bot;
  });

  whatsapp_botkit.startTicking();

  return whatsapp_botkit;
}

module.exports = WhatsappBot;
