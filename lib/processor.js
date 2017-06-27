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
  var options = _.merge({data: data}, self._options);
  var destFile = _.get(options, "to") || "";

  async.auto({
    save: function(next) {
      save(options, next);
    },
    upload: ["save", function(result, next) {
      if (options.bucket) {
        upload(options, next);
      } else {
        next();
      }
    }]
  }, function(err, result) {
    console.log("%s export to %s", (err ? "Failed" : "Successful"), destFile);
    done(err, destFile);
  });
};

//==============================================================================
//-- helper

function save(options, done) {
  var data = _.get(options, "data") || "";
  var localPath = _.get(options, "localPath") || "";

  try {
    fs.ensureDirSync(path.dirname(localPath));
  } catch (err) {
    return done(err);
  }

  var output = fs.createWriteStream(localPath);
  var input = stream(data);
  if (/\.gz$/i.test(localPath)) {
    input = input.pipe(zlib.createGzip());
  }
  input.pipe(output);

  output.on("error", function(err) {
    done(err);
  });

  output.on("close", function() {
    options.debug && console.log("Saved to", localPath);
    done();
  });
}

//------------------------------------------------------------------------------

function upload(options, done) {
  var accessKey = _.get(options, "accessKey") || "";
  var secretKey = _.get(options, "secretKey") || "";
  var bucket = _.get(options, "bucket") || "";
  var bucketPath = _.get(options, "bucketPath") || "";
  var localPath = _.get(options, "localPath") || "";
  var destFile = _.get(options, "to") || "";

  var client = s3.createClient({
    s3Options: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    }
  });

  var uploader = client.uploadFile({
    localFile: localPath,
    s3Params: {
      Bucket: bucket,
      Key: bucketPath
    }
  });

  uploader.on("error", function(err) {
    done(err);
  });

  uploader.on("end", function() {
    options.debug && console.log("Uploaded to", destFile);
    done();
  });
}

//==============================================================================
