var path = require("path");
var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var morgan = require("morgan");
var rfs = require("rotating-file-stream");
var rewrite = require("express-urlrewrite");
var debug = require("debug")("botkit:webserver");

var corsOptions = {
  origin: function(origin, callback) {
    const whitelist = process.env.CORS_WHITELIST.split(";");
    if (true /* whitelist.indexOf(origin) !== -1*/) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200
};

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));
// Ignorar la ruta base, removerla del path
process.env.BASE_PATH &&
  app.use(
    rewrite(
      new RegExp(`^\/${process.env.BASE_PATH.replace(/^\/|\/$/, "")}(.*)$`),
      "$1"
    )
  );
process.env.PUBLIC_PATH && app.use(express.static(process.env.PUBLIC_PATH));

// create a rotating write stream
if (process.env.LOG_FILENAME) {
  var accessLogStream = rfs(process.env.LOG_FILENAME, {
    interval: process.env.LOG_ROTATION || "1d", // rotate daily
    rotationTime: true,
    initialRotation: true,
    path: path.resolve(__dirname, process.env.LOG_DIR || "log")
  });
  app.use(
    morgan(process.env.LOG_FORMAT || "tiny", {
      stream: accessLogStream
    })
  );
}

module.exports = app;
