#!/usr/bin/env node

var _ = require("lodash");

var package = require("./package.json");
var run = require("./lib/run");

var program = require("commander").command(package.name);
var args = process.argv.slice(2);

var localDir = "/tmp/" + package.name;

//==============================================================================

program
  .version(package.version, "-v, --version")
  .option("--connect <connect>", "Db connection string")
  .option("--to <to>", "Destination file")
  .option("--from <from>", "Source table, subquery or sql file")
  .option("--where <where>", "Query criteria")
  .option("--local-dir <local_dir>", "Local directory where remote files are synced, default=" + localDir, localDir)
  .option("--access-key <access_key>", "AWS access key")
  .option("--secret-key <secret_key>", "AWS secret key")
  .option("-f, --force [true|false]", "Non-interactive, default=false", function(v) {return v !== "false"}, false)
  .option("-d, --debug [true|false]", "Show debug messages, default=false", function(v) {return v !== "false"}, false)
  .parse(process.argv);

//-- show help for empty arguments...
!args.length && program.help();

//-- run the program...
run(program.opts());

//==============================================================================
