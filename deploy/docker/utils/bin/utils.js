const shell = require("shelljs");
const fsPromises = require("fs/promises");
const Constants = require("./constants");
const childProcess = require("child_process");
const { ConnectionString } = require("mongodb-connection-string-url");

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
      console.error("Error running command", err);
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


async function updateLastBackupErrorMailSentInMilliSec(ts) {
  await fsPromises.mkdir(Constants.BACKUP_PATH, { recursive: true });
  await fsPromises.writeFile(Constants.LAST_ERROR_MAIL_TS, ts.toString());
}

async function getLastBackupErrorMailSentInMilliSec() {
  try {
    const ts = await fsPromises.readFile(Constants.LAST_ERROR_MAIL_TS);
    return parseInt(ts, 10);
  } catch (error) {
    return 0;
  }
}

async function getCurrentAppsmithVersion() {
  const content = await fsPromises.readFile('/opt/appsmith/rts/version.js', { encoding: 'utf8' });
  return content.match(/\bexports\.VERSION\s*=\s*["']([^"]+)["']/)[1];
}

function preprocessMongoDBURI(uri /* string */) {
  // Partially taken from <https://github.com/mongodb-js/mongosh/blob/8fde100d6d5ec711eb9565b85cb2e28e2da47c80/packages/arg-parser/src/uri-generator.ts#L248>
  // If we don't add the `directConnection` parameter for non-SRV URIs, we'll see the problem at <https://github.com/appsmithorg/appsmith/issues/16104>.
  const cs = new ConnectionString(uri);

  const params = cs.searchParams;
  params.set('appName', 'appsmithctl');

  if (
      !cs.isSRV
      && !params.has('replicaSet')
      && !params.has('directConnection')
      && !params.has('loadBalanced')
      && cs.hosts.length === 1
  ) {
    params.set('directConnection', 'true');
  }

  // For localhost connections, set a lower timeout to avoid hanging for too long.
  // Taken from <https://github.com/mongodb-js/mongosh/blob/8fde100d6d5ec711eb9565b85cb2e28e2da47c80/packages/arg-parser/src/uri-generator.ts#L156>.
  if (!params.has('serverSelectionTimeoutMS') && cs.hosts.every(host => ['localhost', '127.0.0.1'].includes(host.split(':')[0]))) {
    params.set('serverSelectionTimeoutMS', '2000');
  }

  return cs.toString();
}

module.exports = {
  showHelp,
  start,
  stop,
  execCommand,
  listLocalBackupFiles,
  updateLastBackupErrorMailSentInMilliSec,
  getLastBackupErrorMailSentInMilliSec,
  getCurrentAppsmithVersion,
  preprocessMongoDBURI,
};
