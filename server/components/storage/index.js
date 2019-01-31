module.exports = {
  cloudant:
    process.env.COUCH_URL &&
    require("./cloudant.js")({
      ...(process.env.CLOUDANT_APIKEY
        ? { plugins: [{ iamauth: { iamApiKey: process.env.CLOUDANT_APIKEY } }] }
        : {}),
      url: process.env.COUCH_URL
    })
};
