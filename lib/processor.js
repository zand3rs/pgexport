/*
 * lib/processor.js
 *
 */

var _ = require("lodash");
var fs = require("fs-extra");
var async = require("async");
var stream = require("string-to-stream");
var zlib = require("zlib");


//-- export
module.exports = Processor;

//==============================================================================

function Processor(options) {
  var _options = _.merge({}, options);

  Object.defineProperty(this, "_options", {
    get: function() {
      return _options;
    }
  });
}

//------------------------------------------------------------------------------

Processor.prototype.export = function(data, done) {
  var self = this;
  var destFile = _.get(self._options, "to") || "";

  var output = fs.createWriteStream(destFile);
  var input = stream(data);
  if (/\.gz$/i.test(destFile)) {
    input = input.pipe(zlib.createGzip());
  }
  input.pipe(output);

  output.on("error", function(err) {
    done(err);
  });

  output.on("close", function() {
    done(null, destFile);
  });

};

//==============================================================================
