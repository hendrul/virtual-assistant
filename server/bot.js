/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
var debug = require("debug")("botkit:main");
var Botkit = require("botkit");
require("botkit/lib/CoreBot.js");
require("dotenv").config();
var watsonMiddleware = require("botkit-middleware-watson")({
  username: process.env.ASSISTANT_USERNAME,
  password: process.env.ASSISTANT_PASSWORD,
  url: process.env.ASSISTANT_URL,
  workspace_id: process.env.ASSISTANT_WORKSPACE_ID,
  version: "2018-07-10",
  minimum_confidence: 0.5 // (Optional) Default is 0.75
});

var bot_options = {
  replyWithTyping: true,
  stats_optout: true
};

// Never crash on uncaught exceptions
process.on("uncaughtException", err => {
  console.error(err.stack);
});

// Use cloudant database if specified, otherwise store in a JSON file local to the app.
if (process.env.COUCH_URL) {
  bot_options.storage = require("./components/storage_cloudant.js")({
    ...(process.env.CLOUDANT_APIKEY
      ? { plugins: [{ iamauth: { iamApiKey: process.env.CLOUDANT_APIKEY } }] }
      : {}),
    url: process.env.COUCH_URL
  });
}
if (!bot_options.storage) {
  bot_options.json_file_store = __dirname + "/.data/db/"; // store user data in a simple JSON format
}

if (process.env.DB2_CONNECTION_STRING) {
  
}

// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.socketbot(bot_options);

// Set up an Express-powered webserver to expose oauth and webhook endpoints
var webserver = require("./components/express_webserver.js")(controller);

// Open the web socket server
controller.openSocketServer(controller.httpserver);

// Start the bot brain in motion!!
controller.startTicking();

var normalizedPath = require("path").join(__dirname, "skills");
require("fs")
  .readdirSync(normalizedPath)
  .forEach(function(file) {
    require("./skills/" + file)(controller, watsonMiddleware);
  });
// require("./skills/a_initial_context")(controller, watsonMiddleware);
// require("./skills/b_actions")(controller, watsonMiddleware);
// require("./skills/c_message_history")(controller, watsonMiddleware);
// require("./skills/d_watson_anywhere")(controller, watsonMiddleware);
// require("./skills/e_db2_logs")(controller, watsonMiddleware);

console.log(
  "I AM ONLINE! COME TALK TO ME: http://localhost:" + (process.env.PORT || 3000)
);

if (process.env.NODE_ENV === "development") {
  // ////////////////// HOT-LOADING NODE.JS  /////////////////////////////
  var watchedDirs = [`${__dirname}/actions`];
  var watcher = (global.watcher = require("chokidar").watch(watchedDirs));
  watcher.on("ready", () => {
    console.log("Chokidar Watcher READY");
    watcher.on("change", () => {
      console.log("Clearing cache from server");
      Object.keys(require.cache).forEach(id => {
        if (
          watchedDirs.filter(function(dir) {
            return id.startsWith(dir);
          }).length > 0
        ) {
          delete require.cache[id];
        }
      });
    });
  });
}
