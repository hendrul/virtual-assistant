const watsonMiddleware = require("botkit-middleware-watson")({
  iam_apikey: process.env.ASSISTANT_APIKEY,
  url: process.env.ASSISTANT_URL,
  version: process.env.ASSISTANT_APIVERSION,
  workspace_id: process.env.ASSISTANT_WORKSPACE_ID,
  minimum_confidence: 0.75 // (Optional) Default is 0.75
});

module.exports = watsonMiddleware;
