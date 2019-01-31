const http = require("http");
require("dotenv").config();
const app = require("./app");

process.env.ACTIONS_PATH = require("path").join(
  __dirname,
  process.env.ACTIONS_PATH || "components/actions"
);

// Never crash on uncaught exceptions
process.on("uncaughtException", err => {
  console.error(err.stack);
});

const server = http.createServer(app);

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

loadComponent("components/bots", controller => {
  controller.httpserver = server;
  controller.webserver = app;
  typeof controller.init === "function" && controller.init(app, server);
});
loadComponent("components/routes", routeComponent => routeComponent(app));
loadComponent("components/skills");

server.listen(process.env.PORT || 3000, null, function() {
  console.log(
    "Express webserver configured and listening at http://localhost:" +
      process.env.PORT || 3000
  );
});

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
