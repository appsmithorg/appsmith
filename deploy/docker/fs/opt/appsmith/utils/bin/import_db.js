const readlineSync = require('readline-sync');
const process = require('process');
const Constants = require('./constants');
const utils = require('./utils');

async function importDatabase() {
  console.log("Importing the database");
  try {
    await utils.execCommand([
      "mongorestore",
      "--uri=" + utils.getDburl(),
      "--drop",
      `--archive=${Constants.RESTORE_PATH}/${Constants.DUMP_FILE_NAME}`,
      "--gzip",
    ]);
  } catch (error) {
    console.error("Database import failed:", error);
    throw error;
  }
  console.log("Imported the database successfully");
}

// Main application workflow
async function run(forceOption) {
  let errorCode = 0

  await utils.ensureSupervisorIsRunning();

  try {
    console.log('stop backend & rts application before import database')
    await utils.stop(["backend", "rts"]);
    try {
      const shellCmdResult = await utils.execCommandReturningOutput([
        "mongo",
        process.env.APPSMITH_DB_URL,
        "--quiet",
        "--eval",
        "db.getCollectionNames().length",
      ]);
    } catch (error) {
      console.error("Failed to execute mongo command:", error);
      throw error;
    }
    const collectionsLen = parseInt(shellCmdResult.stdout.toString().trimEnd())
    if (collectionsLen > 0) {
      if (forceOption) {
        await importDatabase()
        return
      }
      console.log()
      console.log('**************************** WARNING ****************************')
      console.log(`Your target database is not empty, it has data in ${collectionsLen} collections.`)
      const input = readlineSync.question('Importing this DB will erase this data. Are you sure you want to proceed?[Yes/No] ')
      const answer = input && input.toLocaleUpperCase()
      if (answer === 'Y' || answer === 'YES') {
        await importDatabase()
        return
      } else if (answer === 'N' || answer === 'NO') {
        return
      }
      console.log(`Your input is invalid. Please try to run import command again.`)
    } else {
      await importDatabase()
    }
  } catch (err) {
    console.log(err)
    errorCode = 1
  } finally {
    console.log('start backend & rts application after import database')
    await utils.start(["backend", "rts"]);
    process.exit(errorCode)
  }
}

module.exports = {
  run,
}
