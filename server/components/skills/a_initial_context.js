const watsonMiddleware = require("../watson-middleware");

var next = watsonMiddleware.before;
watsonMiddleware.before = function(message, watsonPayload, cb) {
  if (!(watsonPayload.context && watsonPayload.context.timezone)) {
    var initContext = {};

    // Set timezone
    initContext.timezone = "America/Lima";

    // Set message owner
    initContext.convo_user = message.user;
    initContext.trudesk_user = process.env.TRUDESK_USER_FULANO;
    initContext.trudesk_target_user = process.env.TRUDESK_USER_CVILLAGRAN;
    initContext.trudesk_user_name = "Fulano";
    initContext.trudesk_ticket_group = process.env.TRUDESK_GROUP_USERS;
    // initContext.trudesk_conversation = {
    //   id: process.env.TRUDESK_CONVERSATION_ID,
    //   owner: process.env.TRUDESK_USER_FULANO,
    //   target: process.env.TRUDESK_USER_CVILLAGRAN
    // };

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
  }
  next(message, watsonPayload, cb);
};
