module.exports = function(webserver, controller) {
  webserver.get("/health", function(req, res) {
    res.json({ status: "ok" });
  });
};
