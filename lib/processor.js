/*
 * lib/processor.js
 *
 */

var _ = require("lodash");
var fs = require("fs-extra");
var path = require("path");
var async = require("async");
var stream = require("string-to-stream");
var zlib = require("zlib");
var http = require("http");
var https = require("https");
var s3 = require("s3");

//-- initialize global sockets
http.globalAgent.maxSockets = https.globalAgent.maxSockets = 20;


//-- export
module.exports = Processor;

//==============================================================================

function Processor(options) {
  var to = _.get(options, "to") || "";
  var toS3 = to.match(/^s3:\/\/([^\/]+)(.*)$/);

  var localDir = _.get(options, "localDir") || "";
  var localPath = path.resolve(to);

  var bucket = "";
  var bucketPath = "";

  if (toS3) {
    bucket = _.get(toS3, "1") || "";
    bucketPath = _.trimStart(_.get(toS3, "2") || "", "/");
    localPath = path.resolve(localDir, bucketPath);
  }

  var _options = _.merge({
    bucket: bucket,
    bucketPath: bucketPath,
    localPath: localPath
  }, options);

  Object.defineProperty(this, "_options", {
    get: function() {
      return _options;
    }
  });
}

//------------------------------------------------------------------------------

Processor.prototype.export = function(data, done) {
  var self = this;
  var accessKey = _.get(self._options, "accessKey") || "";
  var secretKey = _.get(self._options, "secretKey") || "";
  var bucket = _.get(self._options, "bucket") || "";
  var bucketPath = _.get(self._options, "bucketPath") || "";
  var localPath = _.get(self._options, "localPath") || "";
  var destFile = _.get(self._options, "to") || "";
  var client = null;
  var uploader = null;

  if (!_.isEmpty(bucket)) {
    client = s3.createClient({
      s3Options: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey
      }
    });

    uploader = client.uploadFile({
      localFile: localPath,
      s3Params: {
        Bucket: bucket,
        Key: bucketPath
      }
    });
  }

  async.auto({
    save: function(next) {
      try {
        fs.ensureDirSync(path.dirname(localPath));
      } catch (err) {
        return next(err);
      }

      var output = fs.createWriteStream(localPath);
      var input = stream(data);
      if (/\.gz$/i.test(localPath)) {
        input = input.pipe(zlib.createGzip());
      }
      input.pipe(output);

      output.on("error", function(err) {
        next(err);
      });

      output.on("close", function() {
        self._options.debug && console.log("Saved to", localPath);
        next();
      });
    },
    upload: ["save", function(result, next) {
      if (!uploader) {
        return next();
      }

      uploader.on("error", function(err) {
        next(err);
      });

      uploader.on("end", function() {
        self._options.debug && console.log("Uploaded to", destFile);
        next();
      });
    }]
  }, function(err, result) {
    console.log("%s export to %s", (err ? "Failed" : "Successful"), destFile);
    done(err, destFile);
  });
};

//==============================================================================
