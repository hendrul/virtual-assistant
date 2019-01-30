var set = require("set-value");
var merge = require("deepmerge");

var ACTIONS_DIR = "../actions/";
var WORKSPACE_ID = process.env.ASSISTANT_WORKSPACE_ID;
// prettier-ignore
var ASSISTANT_SENDMESSAGE_URL =
  'https://gateway.watsonplatform.net/assistant/api/v1/workspaces/' + process.env.ASSISTANT_WORKSPACE_ID + '/message';

/**
 * Intercepts and process the actions on messages comming from watson.
 *
 * @param {Object} controller
 * @param {Object} watsonMiddleware
 */
function main(controller, watsonMiddleware) {
  var nextAfter = watsonMiddleware.after;
  function actionProcessor(bot, watsonData, cb) {
    var actionCalls = watsonData.actions;
    if (actionCalls && actionCalls.length > 0) {
      return processActions(actionCalls).then(function(actionResults) {
        // Merge action results on the payload, this because sendToWatson
        // only allows context deltas, but result variables could be set
        // on input or output fields either
        watsonData = merge(watsonData, actionResults, {
          arrayMerge: function(destinationArray, sourceArray, options) {
            return sourceArray;
          }
        });
        var watsonRequest = {
          workspace_id: WORKSPACE_ID,
          context: watsonData.context || {},
          input: {},
          nodes_visited_details: true
        };
        // prettier-ignore
        watsonMiddleware.conversation.message(
          watsonRequest, 
          function(err, watsonResponse) {
            if (err) throw err;
            actionProcessor(bot, watsonResponse, cb);
          }
        );
      });
    } else {
      nextAfter(bot, watsonData, cb);
    }
  }
  watsonMiddleware.after = actionProcessor;
}

/**
 * Execute action descriptors sequentially.
 * @param {Object[]} actionDescriptors  Action descriptors.
 * @param {Object} options Options
 * @param {string} options.stopOnError Stop execution of more actions after an error is thrown
 * @returns {object}} The results of action calls set on their respective path specified
 *          by "result_variable" attribute
 **/
function processActions(actionDescriptors, options = {}) {
  var stopOnError = options.stopOnError || true;
  var newPayload = {};
  var p = Promise.resolve();
  for (var i = 0; i < actionDescriptors.length; i++) {
    if (actionDescriptors[i].type === "client") {
      (function() {
        var actionCall = actionDescriptors[i];
        var actionParams = Object.assign(
          {},
          process.env,
          actionCall.parameters
        );
        p = p.then(function() {
          var action = findAction(actionCall.name);
          // prettier-ignore
          return Promise.resolve(action(actionParams))
            .then(function(actionResult) {
              setResultValue(newPayload, actionCall.result_variable, actionResult);
            })
            .catch(function(err) {
              setResultValue(newPayload, actionCall.result_variable, { action_error: err.message });
              if(stopOnError) throw err;
            });
        });
      })();
    }
  }
  return p
    .then(function() {
      return newPayload;
    })
    .catch(function(err) {
      return newPayload;
    });
}

/**
 * Sets a value on a path on "payload". Follows the result_variable specs given
 * (here)[https://console.bluemix.net/docs/services/assistant/dialog-actions.html#section-call-action]
 * @param {Object} payload  The watson payload.
 * @param {string} resultVariable The path on the payload where the action result belongs
 * @param {*} value The action result value to set
 **/
function setResultValue(payload, resultVariable, value) {
  var m = resultVariable.match(/^(\$)?(context|input|output)?(.*)/);
  resultVariable = (m[1] || !m[2] ? "context." : "") + (m[2] || "") + m[3];
  set(payload, resultVariable, value);
}

function findAction(name) {
  var normalizedPath = require("path").join(__dirname, ACTIONS_DIR, name);
  var action = require(normalizedPath);
  if (typeof action !== "function" && typeof action.main === "function") {
    action = action.main;
  }
  return action;
}

module.exports = main;
module.exports._processActions = processActions;
module.exports._findAction = findAction;
module.exports._setResultValue = setResultValue;
