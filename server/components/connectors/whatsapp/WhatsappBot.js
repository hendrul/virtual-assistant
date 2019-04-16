const request = require("request");
const CoreBot = require("botkit").core;
var qs = require("querystring");
var url = require("url");

function WhatsappBot(configuration) {
  if (typeof configuration.whitelist === "string") {
    const whitelistArr = configuration.whitelist.split(",");
    configuration = Object.assign({}, configuration, {
      whitelist: whitelistArr
    });
  }

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
    message.channel = message.user;
    next();
  });

  whatsapp_botkit.middleware.format.use(function(
    bot,
    message,
    platform_message,
    next
  ) {
    platform_message.number = message.user;
    platform_message.text = isMediaUrl(message.text)
      ? message.url
      : message.text;
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
      try {
        const message = JSON.parse(request.body.data);
        if (
          !configuration.whitelist ||
          configuration.whitelist.find(
            num => !!num.match(new RegExp(`[+]?${message.from}`))
          )
        ) {
          whatsapp_botkit.ingest(bot, message, response);
        }

        response.sendStatus(200);
      } catch (e) {
        response.sendStatus(400);
      }
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
            "https://panel.apiwha.com/send_message.php?" +
            qs.stringify({
              apikey: apikey,
              number: msg.number,
              text: msg.text
            })
        },
        function(err, response, body) {
          if (err || response.statusCode !== 200) {
            botkit.debug("SEND ERROR", err);
            return cb && cb(err || new Error("Non 200 status"));
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
      msg.user = src.user;

      bot.say(msg, cb);
    };

    bot.findConversation = function(message, cb) {
      botkit.debug("CUSTOM FIND CONVO", message.user, message.channel);
      for (var t = 0; t < botkit.tasks.length; t++) {
        for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
          if (
            botkit.tasks[t].convos[c].isActive() &&
            botkit.tasks[t].convos[c].source_message.user == message.user &&
            botkit.excludedEvents.indexOf(message.type) == -1 // this type of message should not be included
          ) {
            botkit.debug("FOUND EXISTING CONVO!");
            cb(botkit.tasks[t].convos[c]);
            return;
          }
        }
      }
      cb();
    };

    return bot;
  });

  whatsapp_botkit.startTicking();

  return whatsapp_botkit;
}

module.exports = WhatsappBot;
