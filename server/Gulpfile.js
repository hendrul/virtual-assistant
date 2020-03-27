const { exec } = require("child_process");
const path = require("path");
const argv = require("yargs").argv;
const del = require("delete");
const { src, dest, series, parallel } = require("gulp");
const rename = require("gulp-rename");
const template = require("gulp-template");

require("dotenv").config({
  path: `${__dirname}/../shared/branding/${argv.brand || "default_theme"}/.env`
});

const appConfig = JSON.parse(JSON.stringify(process.env));

const BUILD_DIR = `${__dirname}/build`;
const PORT = parseInt(argv.port || process.env.HTTP_PORT || 8080);

appConfig.BRAND = argv.brand || "default_theme";

appConfig.DOCKER_NAMESPACE =
  typeof argv.ns == "string" ? argv.ns : process.env.DOCKER_NAMESPACE || `fit`;

appConfig.DOCKER_IMAGE_VERSION =
  typeof argv.version == "string"
    ? argv.version
    : process.env.DOCKER_IMAGE_VERSION || `latest`;

const isProduction = argv.prod === undefined ? false : true;

function genAppManifest() {
  return src(`${__dirname}/manifest.template.yml`)
    .pipe(template(appConfig))
    .pipe(rename("manifest.yml"))
    .pipe(dest(BUILD_DIR));
}

function genDockerCompose() {
  return src(`${__dirname}/docker-compose.template.yml`)
    .pipe(template(appConfig))
    .pipe(rename("docker-compose.yml"))
    .pipe(dest(BUILD_DIR));
}

function clean() {
  return del(BUILD_DIR, { force: true });
}

function build() {
  return src(
    [
      `${__dirname}/components/**/*`,
      `${__dirname}/sslcert/**/*`,
      `${__dirname}/app.js`,
      `${__dirname}/server.js`,
      `${__dirname}/package.json`,
      `${__dirname}/package-lock.json`
    ],
    { base: __dirname }
  )
    .pipe(src(`${__dirname}/../shared/branding/${argv.brand}/.env`))
    .pipe(dest(BUILD_DIR));
}

function buildImage(done) {
  exec(
    `docker-compose -f ${BUILD_DIR}/docker-compose.yml --project-directory ${__dirname} build`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      done();
    }
  );
}

exports.clean = clean;
exports.genAppManifest = genAppManifest;
exports.genDockerCompose = genDockerCompose;
exports.build = series(clean, build);
exports.buildImage = series(genDockerCompose, buildImage);
exports.default = series(exports.build, exports.buildImage);
