var request = require("request");

// _id:"5c88ba1cdb211a3b3c6abec3"
// createdAt:"2019-03-13T08:06:52.239Z"
// owner:"5c8031a6bbdfa43088680677"
// participants:Array(2) [Object, Object]
// updatedAt:"2019-03-13T08:06:52.237Z"
// userMeta:Array(2) [Object, Object]
function main(params) {
  const TRUDESK_SERVER = params["TRUEDESK_SERVER"];
  const TRUDESK_APIKEY_FULANO = params["TRUDESK_APIKEY_FULANO"];
  let payload = {
    body: params["new_message"],
    cId: params["convo"].id,
    owner: params["convo"].owner
  };

  return new Promise((resolve, reject) => {
    request.post(
      {
        json: true,
        url: `${TRUDESK_SERVER}/api/v1/messages/send`,
        headers: {
          accesstoken: TRUDESK_APIKEY_FULANO
        },
        body: payload
      },
      function(err, response, body) {
        if (err) {
          console.error(err);
          reject(err);
        } else if (body && body.error) {
          console.error(body.error);
          reject(new Error(body.error));
        } else if (response.statusCode >= 400) {
          console.error(new Error("Status code: " + response.statusCode));
        } else {
          resolve(Object.assign({}, payload, body));
        }
      }
    );
  });
}

module.exports = main;
