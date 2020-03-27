const argv = require("yargs").argv;
const { src, dest, series, parallel } = require("gulp");

const {
  clean: cleanClient,
  build: buildClient,
  demoPage
} = require("./client/Gulpfile");
const {
  clean: cleanServer,
  build: buildServer,
  buildImage
} = require("./server/Gulpfile");

const isProduction = argv.prod === undefined ? false : true;

function copyClient() {
  return src("client/dist/**/*").pipe(dest("server/build/public"));
}

exports.cleanAll = parallel(cleanClient, cleanServer);
exports.buildClient = buildClient;
exports.copyClient = copyClient;
exports.buildServer = buildServer;
exports.default = series(
  parallel(series(parallel(buildClient, demoPage)), buildServer),
  copyClient,
  buildImage
);
