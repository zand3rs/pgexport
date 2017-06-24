/*
 * lib/run.js
 *
 */

var _ = require("lodash");
var async = require("async");
var util = require("util");
var prompt = require("prompt");

var Datasource = require("./datasource");
var Processor = require("./processor");

//==============================================================================

module.exports = function(options) {

  prompt.colors = false;
  prompt.message = "";
  prompt.delimiter = "";
  prompt.start();

  //-- debug...
  if (options.debug) {
    console.log("Options: ", options);
  }

  function done(err, ans) {
    if (ans) {
      perform(options, function(err) {
        if (err) {
          console.log("Error:", _.isError(err) ? err.message : err);
        } else {
          console.log("Done.");
        }
      });
    } else {
      console.log("Cancelled.");
    }
  }

  if (options.force) {
    done(null, true);
  } else {
    var promptMsg = util.format("You are about to export data from '%s' to '%s' file.\n" +
                                "Do you want to continue?", options.from, options.to);
    prompt.confirm(promptMsg, done);
  }

};

//==============================================================================

function perform(options, done) {
  async.auto({
    rows: function(next) {
      var datasource = new Datasource(options);
      datasource.getRecords(next);
    },
    data: ["rows", function(result, next) {
      var rows = _.get(result, "rows", []);
      var data = _.map(rows, JSON.stringify);
      next(null, _.join(data, "\n"));
    }],
    file: ["data", function(result, next) {
      var data = _.get(result, "data") || "";
      var processor = new Processor(options);
      processor.export(data, next);
    }]
  }, done);
}

//=============================================================================s
