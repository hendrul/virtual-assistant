var request = require("request");
var translate = require("./watson_translate");

function main(params) {
  var translateParams = Object.assign({}, params, {
    source: "es",
    target: "en"
  });
  return translate(translateParams).then(
    translationResult =>
      new Promise((resolve, reject) => {
        request.post(
          {
            json: true,
            url: `https://gateway.watsonplatform.net/natural-language-understanding/api/v1/analyze?version=2018-03-19`,
            auth: {
              username: params["NLU_USERNAME"],
              password: params["NLU_PASSWORD"]
            },
            body: {
              text: translationResult.translations[0].translation,
              features: {
                emotion: {}
              }
            }
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
              resolve(Object.assign(body.emotion.document.emotion));
            }
          }
        );
      })
  );
}

module.exports = main;
