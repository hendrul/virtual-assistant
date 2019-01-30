var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var querystring = require("querystring");
var debug = require("debug")("botkit:webserver");
var http = require("http");
var fs = require("fs");

var corsOptions = {
  origin: function(origin, callback) {
    const whitelist = process.env.CORS_WHITELIST.split(";");
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200
};

module.exports = function(controller) {
  var webserver = express();
  webserver.use(bodyParser.json());
  webserver.use(bodyParser.urlencoded({ extended: true }));
  webserver.use(cors(corsOptions));
  webserver.use(express.static(process.env.PUBLIC_PATH));

  var server = http.createServer(webserver);

  server.listen(process.env.PORT || 3000, null, function() {
    debug(
      "Express webserver configured and listening at http://localhost:" +
        process.env.PORT || 3000
    );
  });

  // import all the pre-defined routes that are present in /components/routes
  var normalizedPathToRoutes = require("path").join(__dirname, "routes");
  if (fs.existsSync(normalizedPathToRoutes)) {
    fs.readdirSync(normalizedPathToRoutes).forEach(function(file) {
      require("./routes/" + file)(webserver, controller);
    });
  }

  controller.webserver = webserver;
  controller.httpserver = server;

  return webserver;
};
