const fsPromises = require("fs/promises");
const Constants = require("./constants");
const utils = require("./utils");

async function exportDatabase() {
  console.log("export_database  ....");
  const dbUrl = utils.getDburl();
  await fsPromises.mkdir(Constants.BACKUP_PATH, { recursive: true });
  await utils.execCommand([
    "mongodump",
    "--uri=" + dbUrl,
    `--archive=${Constants.BACKUP_PATH}/${Constants.DUMP_FILE_NAME}`,
    "--gzip",
  ]);
  console.log("export_database done");
}

async function run() {
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

module.exports = {
  run,
  exportDatabase,
};
