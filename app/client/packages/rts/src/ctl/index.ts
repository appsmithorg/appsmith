#!/usr/bin/env node

import process from "process";
import { showHelp } from "./utils";
import * as export_db from "./export_db";
import * as import_db from "./import_db";
import * as backup from "./backup";
import * as restore from "./restore";
import * as check_replica_set from "./check_replica_set";
import * as version from "./version";
import * as mongo_shell_utils from "./mongo_shell_utils";
import moveToPostgres from "./move-to-postgres";
import { config } from "dotenv";

const APPLICATION_CONFIG_PATH = "/appsmith-stacks/configuration/docker.env";

// Check if APPSMITH_DB_URL is set, if not set, fall back to APPSMITH_MONGODB_URI
if (!process.env.APPSMITH_DB_URL) {
  process.env.APPSMITH_DB_URL = process.env.APPSMITH_MONGODB_URI;
  delete process.env.APPSMITH_MONGODB_URI;
}

// Loading latest application configuration
config({ path: APPLICATION_CONFIG_PATH });

// AGAIN: Check if APPSMITH_DB_URL is set, if not set, fall back to APPSMITH_MONGODB_URI
if (!process.env.APPSMITH_DB_URL) {
  process.env.APPSMITH_DB_URL = process.env.APPSMITH_MONGODB_URI;
  delete process.env.APPSMITH_MONGODB_URI;
}

const command = process.argv[2];

if (["export-db", "export_db", "ex"].includes(command)) {
  console.log("Exporting database");
  export_db.run();
  console.log("Export database done");
} else if (["import-db", "import_db", "im"].includes(command)) {
  console.log("Importing database");
  // Get Force option flag to run import DB immediately
  const forceOption = process.argv[3] === "-f";

  try {
    import_db.run(forceOption);
    console.log("Importing database done");
  } catch (error) {
    console.error("Failed to import database:", error.message);
    process.exit(1);
  }
} else if (
  ["check-replica-set", "check_replica_set", "crs"].includes(command)
) {
  check_replica_set.exec();
} else if (["backup"].includes(command)) {
  backup.run(process.argv.slice(3));
} else if (["restore"].includes(command)) {
  restore.run();
} else if (
  ["appsmith-version", "appsmith_version", "version"].includes(command)
) {
  version.exec();
} else if (["mongo-eval", "mongo_eval", "mongoEval"].includes(command)) {
  mongo_shell_utils.exec();
} else if (command === "move-to-postgres") {
  moveToPostgres();
} else {
  showHelp();
}
