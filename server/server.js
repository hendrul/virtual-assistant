var http = require("http");
var https = require("https");
var fs = require("fs");
require("dotenv").config();
var commandLineArgs = require("command-line-args");
var localtunnel = require("localtunnel");
var express = require("express");

const ops = commandLineArgs([
  {
    name: "lt",
    alias: "l",
    args: 1,
    description: "Use localtunnel.me to make your bot available on the web.",
    type: Boolean,
    defaultValue: false
  },
  {
    name: "ltsubdomain",
    alias: "s",
    args: 1,
    description:
      "Custom subdomain for the localtunnel.me URL. This option can only be used together with --lt.",
    type: String,
    defaultValue: null
  }
]);

if (ops.lt === false && ops.ltsubdomain !== null) {
  console.log("error: --ltsubdomain can only be used together with --lt.");
  process.exit();
}

const app = require("./app");

process.env.ACTIONS_PATH = require("path").join(
  __dirname,
  process.env.ACTIONS_PATH || "components/actions"
);

let baseApp = express();
baseApp.use(process.env.BASE_PATH || "/", app);

// Never crash on uncaught exceptions
process.on("uncaughtException", err => {
  console.error(err.stack);
});

const options = {};
options.key = fs.readFileSync("./sslcert/server-key.pem");
options.cert = fs.readFileSync("./sslcert/server-crt.pem");
try {
  options.ca = fs.readFileSync("./sslcert/ca-crt.pem");
} catch (e) {}

let httpServer;
let httpsServer;
if (
  process.env.PORT_HTTP ||
  (!process.env.PORT_HTTPS && !process.env.PORT_HTTP)
) {
  httpServer = http.createServer(baseApp);
}
if (
  process.env.PORT_HTTPS ||
  (!process.env.PORT_HTTPS && !process.env.PORT_HTTP)
) {
  httpsServer = https.createServer(options, baseApp);
}

function loadComponent(path = "components", initializer = i => i) {
  const normalizedPath = require("path").join(__dirname, path);
  if (require("fs").existsSync(normalizedPath)) {
    require("fs")
      .readdirSync(path)
      .forEach(file =>
        initializer(require(require("path").join(normalizedPath, file)))
      );
  }
}

loadComponent("components/connectors", controller => {
  controller.httpserver = httpServer;
  controller.httpsserver = httpsServer;
  controller.webserver = app;
  typeof controller.init === "function" &&
    controller.init(app, httpServer, httpsServer);
});
loadComponent("components/routes", routeComponent => routeComponent(app));
loadComponent("components/skills");

if (ops.lt) {
  var tunnel = localtunnel(
    process.env.PORT || 3000,
    { subdomain: ops.ltsubdomain },
    function(err, tunnel) {
      if (err) {
        console.log(err);
        process.exit();
      }
      console.log("Server exposed at the following URL: " + tunnel.url);
    }
  );

  tunnel.on("close", function() {
    console.log(
      "Your bot is no longer available on the web at the localtunnnel.me URL."
    );
    process.exit();
  });
}

if (httpsServer) {
  httpsServer.listen(process.env.PORT_HTTPS || 3000, null, function() {
    console.log(
      "Express webserver configured and listening at https://localhost:" +
        (process.env.PORT_HTTPS || 3000) +
        (process.env.BASE_PATH ? process.env.BASE_PATH : "")
    );
  });
}

if (httpServer) {
  httpServer.listen(process.env.PORT_HTTP || 3001, null, function() {
    console.log(
      "Express webserver configured and listening at http://localhost:" +
        (process.env.PORT_HTTP || 3001) +
        (process.env.BASE_PATH ? process.env.BASE_PATH : "")
    );
  });
}

if (process.env.NODE_ENV === "development") {
  // ////////////////// HOT-LOADING NODE.JS  /////////////////////////////
  var watchedDirs = [process.env.ACTIONS_PATH];
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
