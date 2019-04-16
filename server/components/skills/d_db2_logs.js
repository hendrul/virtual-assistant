var debug = require("debug");
var log = debug("app:skill:db2_logs");
var error = debug("app:skill:db2_logs:error");

const watsonMiddleware = require("../watson-middleware");

if (!process.env.DB2_CONNECTION_STRING) {
  log(
    "DB2_CONNECTION_STRING is not defined in .env, messages won't be logged to db2"
  );
  module.exports = function() {};
  return;
}

var uuid = require("uuid");
var ibmdb = require("ibm_db");
var Pool = require("ibm_db").Pool;
var pool = (global.ibmdbPool = new Pool());
pool.setMaxPoolSize(5);
pool.init(3, process.env.DB2_CONNECTION_STRING);

var sql = function(i) {
  return i[0].replace(/\n/g, " ");
};

try {
  var conn = ibmdb.openSync(process.env.DB2_CONNECTION_STRING, {
    connectTimeout: 5
  });
  // Create table for message logs
  var data = conn.querySync(sql`
      CREATE TABLE MSG_LOGS (
        ID  VARCHAR(36) NOT NULL,
        USER  VARCHAR(36) NOT NULL,
        MSG VARCHAR(2000) NOT NULL,
        DIRECTION VARCHAR(9) NOT NULL,
        CHANNEL VARCHAR(100) NOT NULL,
        CREATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
        REPLY_TO VARCHAR(36),
        ORDER SMALLINT NOT NULL,
        CONSTRAINT PKEYDNO
          PRIMARY KEY (ID)
      )
  `);
  if (data instanceof Error) {
    throw data;
  } else {
    log("Schema for msg logs created.");
  }
} catch (err) {
  if (err.sqlcode === -601) {
    log("Schema for msg logs already exists.");
  } else {
    error(
      "Can't create DB2 schema for msg logs. Message logging will be disabled"
    );
    module.exports = function() {};
    return;
  }
} finally {
  conn && conn.closeSync();
}

var _before = watsonMiddleware.before;
var _after = watsonMiddleware.after;

watsonMiddleware.before = function(message, watsonPayload, cb) {
  pool.open(process.env.DB2_CONNECTION_STRING, function(err, conn) {
    if (err) {
      error("Error opening pool, cannot store message logs.");
      conn.close();
      _before(message, watsonPayload, cb);
      return;
    }

    if (!message.text) {
      _before(message, watsonPayload, cb);
      conn.close();
      return;
    }

    var InsertLogStmt = conn.prepareSync(sql`
      INSERT INTO MSG_LOGS (ID, USER, MSG, DIRECTION, CHANNEL, ORDER)
      VALUES (?, ?, ?, ?, ?, ?);
    `);

    try {
      message.guid = uuid();
      var result = InsertLogStmt.executeSync([
        message.guid,
        message.user,
        message.text,
        "incomming",
        message.channel,
        0
      ]);
    } catch (err) {
      error("Error when saving message to log.");
    } finally {
      conn.close();
    }
    _before(message, watsonPayload, cb);
  });
};

watsonMiddleware.after = function(message, watsonResponse, cb) {
  pool.open(process.env.DB2_CONNECTION_STRING, function(err, conn) {
    if (err) {
      error("Error opening pool, cannot store message logs.");
      _before(message, watsonPayload, cb);
      return;
    }

    var InsertLogStmt = conn.prepareSync(sql`
      INSERT INTO MSG_LOGS (ID, USER, MSG, DIRECTION, CHANNEL, REPLY_TO, ORDER)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `);

    getTextMessages(watsonResponse).forEach(function(msgText, i) {
      try {
        var result = InsertLogStmt.executeSync([
          uuid(),
          message.user,
          msgText,
          "outgoing",
          message.channel,
          message.guid || null,
          i + 1
        ]);
      } catch (err) {
        error("Error when saving message to log.");
      } finally {
        conn.close();
      }
    });

    _after(message, watsonResponse, cb);
  });
};

function getTextMessages(watsonData) {
  if (watsonData && watsonData.output.generic) {
    return watsonData.output.generic
      .map(function(resp) {
        switch (resp.response_type) {
          case "text":
            var text = [].concat(resp.text);
            var digressed = ((watsonData.context || {}).system || {}).digressed;
            return digressed ? text[0] : text.join("\n");
          case "option":
          case "image":
          case "pause":
          default:
            return;
        }
      })
      .filter(function(resp) {
        return !!resp;
      });
  }
}
