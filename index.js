#!/usr/bin/env node

var _ = require("lodash");

var package = require("./package.json");
var run = require("./lib/run");

var program = require("commander").command(package.name);
var args = process.argv.slice(2);

//==============================================================================

program
  .version(package.version, "-v, --version")
  .option("--connect <connect>", "Db connection string")
  .option("--to <to>", "Destination file")
  .option("--from <from>", "Source table, sub-select or sql file")
  .option("--where <where>", "Query criteria")
  .option("-f, --force [true|false]", "Non-interactive, default=false", function(v) {return v !== "false"}, false)
  .option("-d, --debug [true|false]", "Show debug messages, default=false", function(v) {return v !== "false"}, false)
  .parse(process.argv);

//-- show help for empty arguments...
!args.length && program.help();

//-- run the program...
run(program.opts());

//==============================================================================
