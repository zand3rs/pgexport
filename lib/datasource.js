/*
 * lib/datasource.js
 *
 */

var _ = require("lodash");
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
  var srcTable = _.get(self._options, "from") || "";
  var query = "SELECT * FROM (select t hittype, ds datasource, an appname from " + srcTable + ") t";

  var client = new pg.Client(conString);

  async.auto({
    connected: function(next) {
      client.connect(function(err) {
        next(err, !err);
      });
    },
    rows: ["connected", function(result, next) {
      client.query(query, function(err, res) {
        if (err) {
            console.log("Query error:",
              (_.isError(err) ? err.message : err),
              (self._options.debug ? query : ""));
        }
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
