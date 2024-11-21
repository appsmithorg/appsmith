import fsPromises from "fs/promises";
import * as Constants from "./constants";
import childProcess from "child_process";
import fs from "node:fs";
import { ConnectionString } from "mongodb-connection-string-url";

export function showHelp() {
  console.log(
    "\nUsage: appsmith <command> to interact with appsmith utils tool",
  );
  console.log("\nOptions:\r");
  console.log("\tex, export_db\t\tExport internal database.\r");
  console.log("\tim, import_db\t\tImport internal database.\r");
  console.log("\tcrs, check_replica_set\tCheck replica set mongoDB.\r");
  console.log("\tbackup\t\t\tTake a backup of Appsmith instance.\r");
  console.log("\trestore\t\t\tRestore Appsmith instance from a backup.\r");
  console.log("\t--help\t\t\t" + "Show help.");
}

export async function ensureSupervisorIsRunning() {
  try {
    await execCommandSilent(["/usr/bin/supervisorctl"]);
  } catch (e) {
    console.error("Supervisor is not running, exiting.");
    throw e;
  }
}

export async function stop(apps) {
  console.log("Stopping", apps);
  await execCommand(["/usr/bin/supervisorctl", "stop", ...apps]);
  console.log("Stopped", apps);
}

export async function start(apps) {
  console.log("Starting", apps);
  await execCommand(["/usr/bin/supervisorctl", "start", ...apps]);
  console.log("Started", apps);
}

export function getDburl() {
  let dbUrl = "";
  try {
    const env_array = fs
      .readFileSync(Constants.ENV_PATH, "utf8")
      .toString()
      .split("\n");
    for (const i in env_array) {
      if (
        env_array[i].startsWith("APPSMITH_MONGODB_URI") ||
        env_array[i].startsWith("APPSMITH_DB_URL")
      ) {
        dbUrl = env_array[i].toString().split("=")[1].trim();
        break; // Break early when the desired line is found
      }
    }
  } catch (err) {
    console.error("Error reading the environment file:", err);
  }
  const dbEnvUrl =
    process.env.APPSMITH_DB_URL || process.env.APPSMITH_MONGO_DB_URI;
  // Make sure dbEnvUrl takes precedence over dbUrl
  if (dbEnvUrl && dbEnvUrl !== "undefined") {
    dbUrl = dbEnvUrl.trim();
  }
  return dbUrl;
}

export function execCommand(cmd: string[], options?) {
  return new Promise<void>((resolve, reject) => {
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

export function execCommandReturningOutput(cmd, options?) {
  return new Promise<string>((resolve, reject) => {
    const p = childProcess.spawn(cmd[0], cmd.slice(1), options);

    p.stdin.end();

    const outChunks = [],
      errChunks = [];

    p.stdout.setEncoding("utf8");
    p.stdout.on("data", (data) => {
      outChunks.push(data.toString());
    });

    p.stderr.setEncoding("utf8");
    p.stderr.on("data", (data) => {
      errChunks.push(data.toString());
    });

    p.on("close", (code) => {
      const output = (
        outChunks.join("").trim() +
        "\n" +
        errChunks.join("").trim()
      ).trim();
      if (code === 0) {
        resolve(output);
      } else {
        reject(output);
      }
    });
  });
}

export async function listLocalBackupFiles() {
  // Ascending order
  const backupFiles = [];
  await fsPromises
    .readdir(Constants.BACKUP_PATH)
    .then((filenames) => {
      for (const filename of filenames) {
        if (filename.match(/^appsmith-backup-.*\.tar\.gz(\.enc)?$/)) {
          backupFiles.push(filename);
        }
      }
    })
    .catch((err) => {
      console.log(err);
    });
  return backupFiles;
}

export async function updateLastBackupErrorMailSentInMilliSec(ts) {
  await fsPromises.mkdir(Constants.BACKUP_PATH, { recursive: true });
  await fsPromises.writeFile(Constants.LAST_ERROR_MAIL_TS, ts.toString());
}

export async function getLastBackupErrorMailSentInMilliSec() {
  try {
    const ts = await fsPromises.readFile(Constants.LAST_ERROR_MAIL_TS, "utf8");
    return parseInt(ts, 10);
  } catch (error) {
    return 0;
  }
}

export async function getCurrentAppsmithVersion() {
  return (
    JSON.parse(await fsPromises.readFile("/opt/appsmith/info.json", "utf8"))
      .version ?? ""
  );
}

export function preprocessMongoDBURI(uri /* string */) {
  // Partially taken from <https://github.com/mongodb-js/mongosh/blob/8fde100d6d5ec711eb9565b85cb2e28e2da47c80/packages/arg-parser/src/uri-generator.ts#L248>
  // If we don't add the `directConnection` parameter for non-SRV URIs, we'll see the problem at <https://github.com/appsmithorg/appsmith/issues/16104>.
  const cs = new ConnectionString(uri);

  const params = cs.searchParams;
  params.set("appName", "appsmithctl");

  if (
    !cs.isSRV &&
    !params.has("replicaSet") &&
    !params.has("directConnection") &&
    !params.has("loadBalanced") &&
    cs.hosts.length === 1
  ) {
    params.set("directConnection", "true");
  }

  // For localhost connections, set a lower timeout to avoid hanging for too long.
  // Taken from <https://github.com/mongodb-js/mongosh/blob/8fde100d6d5ec711eb9565b85cb2e28e2da47c80/packages/arg-parser/src/uri-generator.ts#L156>.
  if (
    !params.has("serverSelectionTimeoutMS") &&
    cs.hosts.every((host) =>
      ["localhost", "127.0.0.1"].includes(host.split(":")[0]),
    )
  ) {
    params.set("serverSelectionTimeoutMS", "2000");
  }

  return cs.toString();
}

export function execCommandSilent(cmd, options?) {
  return new Promise<void>((resolve, reject) => {
    let isPromiseDone = false;

    const p = childProcess.spawn(cmd[0], cmd.slice(1), {
      ...options,
      stdio: "ignore",
    });

    p.on("close", (code) => {
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
      reject(err);
    });
  });
}

export function getDatabaseNameFromMongoURI(uri) {
  const uriParts = uri.split("/");
  return uriParts[uriParts.length - 1].split("?")[0];
}
