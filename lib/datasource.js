/*
 * lib/datasource.js
 *
 */

var _ = require("lodash");
var fs = require("fs-extra");
var async = require("async");
var pg = require("pg");


//-- export
module.exports = Datasource;

//==============================================================================

function Datasource(options) {
  var _options = _.merge({}, options);

  Object.defineProperty(this, "_options", {
    get: function() {
      return _options;
    }
  });
}

//------------------------------------------------------------------------------

Datasource.prototype.getRecords = function(done) {
  var self = this;

  var conString = "postgres://" + (_.get(self._options, "connect") || "");
  var from = _.get(self._options, "from") || "";

  var client = new pg.Client(conString);

  async.auto({
    connected: function(next) {
      client.connect(function(err) {
        next(err, !err);
      });
    },
    query: ["connected", function(result, next) {
      var srcTable = from;

      if (/\.sql$/i.test(from)) {
        try {
          srcTable = fs.readFileSync(from, "utf8");
        } catch (err) {
          return next(err);
        }
      }
      if (/^select/i.test(srcTable)) {
        srcTable = "(" + srcTable + ") t";
      }
      var query = "SELECT * FROM " + srcTable;
      next(null, query);
    }],
    rows: ["query", function(result, next) {
      var query = result.query || "";

      //-- debug...
      self._options.debug && console.log("Query:", query);

      client.query(query, function(err, res) {
        next(err, _.get(res, "rows", []));
      });
    }]
  }, function(err, result) {
    if (result.connected) {
      client.end();
    }
    done(err, result.rows);
  });

};

//==============================================================================
