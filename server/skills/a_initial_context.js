var Botkit = require("botkit");

module.exports = function(controller, watsonMiddleware) {
  var next = watsonMiddleware.before;
  watsonMiddleware.before = function(message, watsonPayload, cb) {
    switch (message.type) {
      case "welcome":
        var initContext = {};

        // Set timezone
        initContext.timezone = "America/Lima";

        // Set cloud-functions Auth Key
        var authKey = process.env.WSK_AUTH_KEY;
        if (authKey) {
          initContext.func_credentials = {
            api_key: authKey
          };
        }

        watsonPayload = Object.assign({}, watsonPayload, {
          context: Object.assign({}, watsonPayload.context, initContext),
          alternate_intents: true
        });
        break;
    }
    next(message, watsonPayload, cb);
  };
};
