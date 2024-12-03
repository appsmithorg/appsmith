import fsPromises from "fs/promises";
import * as Constants from "./constants";
import * as utils from "./utils";
import { writeDataFromMongoToJsonlFiles } from './move-to-postgres.mjs';


export async function exportDatabase() {
  const dbUrl = utils.getDburl();
  try {
    await writeDataFromMongoToJsonlFiles(dbUrl);
    console.log('MongoDB data exported successfully.');
  } catch (error) {
    console.error('Error exporting MongoDB data:', error);
  }
}

export async function run() {
  let errorCode = 0;

  await utils.ensureSupervisorIsRunning();

  try {
    console.log("stop backend & rts application before export database");
    await utils.stop(["backend", "rts"]);
    await exportDatabase();
    console.log("start backend & rts application after export database");
    console.log();
    console.log("\x1b[0;33m++++++++++++++++++++ NOTE ++++++++++++++++++++");
    console.log();
    console.log(
      "Please remember to also copy APPSMITH_ENCRYPTION_SALT and APPSMITH_ENCRYPTION_PASSWORD variables from the docker.env file to the target instance where you intend to import this database dump.",
    );
    console.log();
    console.log("++++++++++++++++++++++++++++++++++++++++++++++\x1b[0m");
    console.log();
  } catch (err) {
    console.log(err);
    errorCode = 1;
  } finally {
    await utils.start(["backend", "rts"]);
    process.exit(errorCode);
  }
}
