#!/usr/bin/env node

const process = require("process");
const utils = require("./utils");
const export_db = require("./export_db.js");
const import_db = require("./import_db.js");
const migrate = require("./migrate.js");
const check_replica_set = require("./check_replica_set.js");
const version = require("./version.js");
const mongo_shell_utils = require("./mongo_shell_utils.js");

const APPLICATION_CONFIG_PATH = "/appsmith-stacks/configuration/docker.env";

// Loading latest application configuration
require("dotenv").config({ path: APPLICATION_CONFIG_PATH });

const command = process.argv[2];

if (["export-db", "export_db", "ex"].includes(command)) {
  console.log("Exporting database");
  export_db.run();
  console.log("Export database done");
  return;
}

if (["import-db", "import_db", "im"].includes(command)) {
  console.log("Importing database");
  // Get Force option flag to run import DB immediately
  const forceOption = process.argv[3] === "-f";
  import_db.runImportDatabase(forceOption);
  console.log("Importing database done");
  return;
}

if (["migrate", "mi"].includes(command) && process.argv[3]) {
  const arrString = process.argv[3].split("@");
  console.log("Start migrate instance");
  migrate.runMigrate(arrString[0], arrString[1]);
  return;
}

if (["check-replica-set", "check_replica_set", "crs"].includes(command)) {
  check_replica_set.exec();
  return;
}

if (["backup", "restore"].includes(command)) {
  require(`./${command}.js`).run(process.argv.slice(3));
  return;
}

if (["appsmith-version", "appsmith_version", "version"].includes(command)) {
  version.exec();
  return;
}
if (["mongo-eval", "mongo_eval", "mongoEval"].includes(command)) {
  mongo_shell_utils.exec(process.argv.slice(3));
  return;
}

utils.showHelp();
