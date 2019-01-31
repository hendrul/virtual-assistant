var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
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
app.use(express.static(process.env.PUBLIC_PATH));

module.exports = app;
