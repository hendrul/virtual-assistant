const watsonMiddleware = require("botkit-middleware-watson")({
  username: process.env.ASSISTANT_USERNAME,
  password: process.env.ASSISTANT_PASSWORD,
  url: process.env.ASSISTANT_URL,
  workspace_id: process.env.ASSISTANT_WORKSPACE_ID,
  version: "2018-07-10",
  minimum_confidence: 0.5 // (Optional) Default is 0.75
});

module.exports = watsonMiddleware;
