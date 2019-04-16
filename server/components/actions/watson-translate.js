var request = require("request");

function main(params) {
  let payload = {
    source: params["source"],
    target: params["target"],
    text: params["text"]
  };

  return new Promise((resolve, reject) => {
    request.post(
      {
        json: true,
        url: `https://gateway.watsonplatform.net/language-translator/api/v3/translate?version=2018-05-01`,
        auth: {
          username: params["TRANSLATOR_USERNAME"],
          password: params["TRANSLATOR_PASSWORD"]
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
