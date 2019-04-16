var request = require("request");

function main(params) {
  const TRUDESK_SERVER = params["TRUEDESK_SERVER"];
  const TRUDESK_APIKEY_FULANO = params["TRUDESK_APIKEY_FULANO"];
  return new Promise((resolve, reject) => {
    let payload = {
      owner: params["trudesk_user"],
      participants: [params["trudesk_target_user"], params["trudesk_user"]]
    };
    request.post(
      {
        json: true,
        url: `${TRUDESK_SERVER}/api/v1/messages/conversation/start`,
        headers: {
          accesstoken: TRUDESK_APIKEY_FULANO
        },
        body: payload
      },
      function(err, response, body) {
        if (err) {
          reject(err);
        } else if (body.error) {
          reject(new Error(body.error));
        } else {
          resolve(Object.assign({}, payload, body.conversation));
        }
      }
    );
  });
}

module.exports = main;
