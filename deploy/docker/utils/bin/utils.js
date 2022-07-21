const shell = require("shelljs");
const fsPromises = require("fs/promises");
const Constants = require("./constants");
const childProcess = require("child_process");

function showHelp() {
  console.log(
    "\nUsage: appsmith <command> to interact with appsmith utils tool"
  );
  console.log("\nOptions:\r");
  console.log("\tex, export_db\t\tExport interal database.\r");
  console.log("\tim, import_db\t\tImport interal database.\r");
  console.log("\tmi, migrate\t\tMigrate new server.\r");
  console.log("\tcrs, check_replica_set\tCheck replica set mongoDB.\r");
  console.log("\tbackup\t\t\tTake a backup of Appsmith instance.\r");
  console.log("\trestore\t\t\tRestore Appsmith instance from a backup.\r");
  console.log("\testimate_billing\tEstimate billing based on past usage.\r");
  console.log("\t--help\t\t\t" + "Show help.");
}

function stop(apps) {
  const appsStr = apps.join(" ");
  console.log("Stopping " + appsStr);
  shell.exec("/usr/bin/supervisorctl stop " + appsStr);
  console.log("Stopped " + appsStr);
}

function start(apps) {
  const appsStr = apps.join(" ");
  console.log("Starting " + appsStr);
  shell.exec("/usr/bin/supervisorctl start " + appsStr);
  console.log("Started " + appsStr);
}

function execCommand(cmd, options) {
  return new Promise((resolve, reject) => {
    let isPromiseDone = false;

    const p = childProcess.spawn(cmd[0], cmd.slice(1), {
      stdio: "inherit",
      ...options,
    });

    p.on("exit", (code) => {
      if (isPromiseDone) {
        return;
      }
      isPromiseDone = true;
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });

    p.on("error", (err) => {
      if (isPromiseDone) {
        return;
      }
      isPromiseDone = true;
      log.error("Error running command", err);
      reject();
    });
  });
}

async function listLocalBackupFiles() {
  // Ascending order
  const backupFiles = [];
  await fsPromises
    .readdir(Constants.BACKUP_PATH)
    .then((filenames) => {
      for (let filename of filenames) {
        if (filename.match(/^appsmith-backup-.*\.tar\.gz$/)) {
          backupFiles.push(filename);
        }
      }
    })
    .catch((err) => {
      console.log(err);
    });
  return backupFiles;
}

module.exports = {
  showHelp,
  start,
  stop,
  execCommand,
  listLocalBackupFiles,
};
