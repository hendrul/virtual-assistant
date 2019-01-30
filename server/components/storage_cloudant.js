const Cloudant = require("@cloudant/cloudant");

function createStorage(cloudant, dbName) {
  return {
    get: function(teamId, cb) {
      cloudant.db.create(dbName, () => {
        const teamsDb = cloudant.db.use(dbName);
        teamsDb.get(teamId, (err, doc) => {
          if (err) {
            cb(err);
          } else {
            cb(null, doc);
          }
        });
      });
    },
    save: function(teamData, cb) {
      cloudant.db.create(dbName, () => {
        const teamsDb = cloudant.db.use(dbName);
        teamsDb.index(
          {
            name: "date-idx",
            type: "json",
            index: { fields: ["date"] }
          },
          function() {
            const update = Object.assign({}, teamData);
            if (!update._rev) {
              teamsDb.get(update.id, (err, body) => {
                if (!err && body._rev) {
                  update._rev = body._rev;
                }
                teamsDb.insert(update, update.id, (err1, body1) => {
                  if (err1) {
                    cb(err1);
                  } else {
                    cb(null, body1.id);
                  }
                });
              });
            } else {
              teamsDb.insert(update, update.id, (err, body) => {
                if (err) {
                  cb(err);
                } else {
                  cb(null, body.id);
                }
              });
            }
          }
        );
      });
    },
    delete: function(teamId, cb) {
      cloudant.db.create(dbName, () => {
        const teamsDb = cloudant.db.use(dbName);
        teamsDb.delete(teamId, cb);
      });
    },
    all: function(cb) {
      cloudant.db.create(dbName, () => {
        const teamsDb = cloudant.db.use(dbName);
        teamsDb.list({ include_docs: true }, (err, body) => {
          if (err) {
            cb(err);
          } else {
            cb(null, body.rows.map(row => row.doc));
          }
        });
      });
    }
  };
}

module.exports = function(config) {
  const dbname = "history";
  const cloudant = Cloudant(config);
  const storage = {
    teams: createStorage(cloudant, "teams"),
    users: createStorage(cloudant, "users"),
    channels: createStorage(cloudant, "channels"),
    history: {
      addToHistory: function(message, user) {
        return new Promise(function(resolve, reject) {
          cloudant.db.create(dbname, () => {
            const db = cloudant.db.use(dbname);
            db.index(
              {
                name: "date-idx",
                type: "json",
                index: { fields: ["date"] }
              },
              function(er, response) {
                const reg = {
                  userId: user,
                  message: message,
                  date: new Date().toISOString()
                };
                db.insert(reg, function(err, body) {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(body.id);
                  }
                });
              }
            );
          });
        });
      },
      getHistoryForUser: function(user, limit) {
        return new Promise(function(resolve, reject) {
          const db = cloudant.db.use(dbname);
          db.find(
            {
              selector: { userId: user },
              sort: [{ date: "desc" }],
              limit: limit
            },
            function(err, result) {
              if (err) {
                reject(err);
              } else {
                resolve(result.docs.reverse());
              }
            }
          );
        });
      }
    }
  };
  return storage;
};
