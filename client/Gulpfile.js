/* jshint strict: false */
/* globals require, console */
const path = require("path");
const del = require("delete");

const { src, dest, series, parallel } = require("gulp");
const exit = require("gulp-exit");

const browserify = require("browserify");
const watchify = require("watchify");
const preprocessify = require("preprocessify");

const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");

const rename = require("gulp-rename");
const template = require("gulp-template");
const uglify = require("gulp-uglify");
const sourcemaps = require("gulp-sourcemaps");
const connect = require("gulp-connect");
const argv = require("yargs").argv;

require("dotenv").config({
  path: `${__dirname}/../shared/branding/${argv.brand || "default_theme"}/.env`
});

const appConfig = JSON.parse(JSON.stringify(process.env));
appConfig.BRAND = argv.brand || "default_brand";

appConfig.BASE_PATH = process.env.BASE_PATH || "/";

const BUILD_DIR = `${__dirname}/dist`;
const PORT = parseInt(argv.port || process.env.HTTP_PORT || 8080);

function clean() {
  return del(BUILD_DIR, { force: true });
}

function demoPage() {
  const { BRAND } = appConfig;
  return src(`${__dirname}/../shared/branding/${BRAND}/demo.template.html`)
    .pipe(template(appConfig))
    .pipe(rename("index.html"))
    .pipe(dest(BUILD_DIR));
}

function getBundler() {
  const bundler = watchify(
    browserify({
      entries: `${__dirname}/src/index.js`,
      extensions: ["js", ".jsx"],
      debug: true
    })
      .transform(preprocessify, {
        includeExtensions: [".js", ".jsx"],
        context: appConfig
      })
      .transform("browserify-css", {
        inlineImages: true
      })
      .transform("babelify", {
        presets: ["@babel/env", "@babel/react"],
        plugins: ["@babel/plugin-proposal-class-properties"],
        sourceMaps: true
      })
      .transform("imgurify")
  );
  bundler.makeBundle = function() {
    return (
      this.bundle()
        .on("error", function(err) {
          console.error(err);
          this.emit("end");
        })
        .pipe(source("index.js"))
        .pipe(buffer())
        //.pipe(rename('index.min.js'))
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(sourcemaps.write("./"))
        .pipe(dest(BUILD_DIR))
        .pipe(connect.reload())
    );
  };
  return bundler;
}

function watch() {
  const bundler = getBundler();
  bundler.on("update", function() {
    console.log("-> bundling...");
    bundler.makeBundle();
  });
  return bundler.makeBundle();
}

function build(done) {
  const bundler = getBundler();
  bundler.makeBundle().on("end", () => {
    bundler.close();
    done();
  });
}

function serve() {
  connect.server({
    root: BUILD_DIR,
    livereload: true,
    port: PORT
  });
}

exports.clean = clean;
exports.demoPage = demoPage;
exports.watch = watch;
exports.build = build;
exports.serve = series(clean, demoPage, watch, serve);
exports.default = exports.serve;
