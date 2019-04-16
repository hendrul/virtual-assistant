const watsonMiddleware = require("../watson-middleware");
const trudesk_message_send = require("../actions/trudesk_message_send");

var nextBefore = watsonMiddleware.before;
watsonMiddleware.before = function(message, watsonPayload, cb) {
  if (watsonPayload.context && watsonPayload.context.trudesk_conversation) {
    if (watsonPayload.input.text.match(/#terminar/)) {
      delete watsonPayload.context.trudesk_conversation;
      watsonMiddleware.updateContextAsync(message.user, watsonPayload);
    } else {
      let conversation_id = watsonPayload.context.trudesk_conversation._id;
      let owner = watsonPayload.context.trudesk_conversation.owner;
      // prettier-ignore
      let target = watsonPayload.context.trudesk_conversation.participants.find( p => p._id !== owner)._id;

      trudesk_message_send({
        new_message: watsonPayload.input.text,
        convo: {
          id: conversation_id,
          owner: owner
        }
      }).then(data => {
        global.socket.emit("chatMessage", {
          conversation: conversation_id,
          tosendChatMessage: target,
          to: target,
          from: owner,
          type: "s",
          messageId: data.message._id,
          message: data.message.body
        });
      });
    }
  } else {
    nextBefore(message, watsonPayload, cb);
  }
};
