var debug = require("debug");
var log = debug("app:skill:db2_logs");
var error = debug("app:skill:db2_logs:error");

var sql = function(i) {
  return i[0].replace(/\n/g, " ");
};

function main(params) {
  return new Promise(function(resolve, reject) {
    ibmdbPool;
    pool.open(process.env.DB2_CONNECTION_STRING, function(err, conn) {
      if (err) {
        error("Error opening pool, cannot store message logs.");
        _before(message, watsonPayload, cb);
        return;
      }

      stmt.query(
        sql`
        SELECT * FROM CUSTOMER
        WHERE DNI = ${params["DNI"]}`,
        function(err, data) {
          if (err) reject(err);
          else resolve(data);
          conn.close();
        }
      );
    });
  });
}

module.exports = main;
