var AssistantV1 = require("watson-developer-cloud/assistant/v1");

var cache;
function main(params) {
  var intentRegex = new RegExp(params["regex"] ? params["regex"] : ".*", "i");
  return new Promise(function(resolve, reject) {
    var currentTime = Date.now();
    if (cache && currentTime - cache.lastUpdate < 60 * 1000) {
      resolve(filterIntents(cache.data, intentRegex));
    } else {
      var conversation = new AssistantV1({
        username: params["ASSISTANT_USERNAME"],
        password: params["ASSISTANT_PASSWORD"],
        version: params["ASSISTANT_APIVERSION"],
        url: params["ASSISTANT_URL"]
      });
      conversation.listIntents(
        {
          workspace_id: params["ASSISTANT_WORKSPACE_ID"],
          export: true
        },
        function(err, response) {
          var descriptions = filterIntents(response.intents, intentRegex);
          cache = {
            lastUpdate: Date.now(),
            data: response.intents
          };
          resolve(descriptions);
        }
      );
    }
  });
}

function filterIntents(intents, regex) {
  return intents
    .filter(function(intent) {
      return (
        intent &&
        typeof intent.intent === "string" &&
        typeof intent.description === "string" &&
        intent.description.length > 0 &&
        !!intent.intent.match(regex)
      );
    })
    .map(function(intent) {
      return intent.description;
    });
}

module.exports = main;
