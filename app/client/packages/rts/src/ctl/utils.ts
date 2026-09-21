import fsPromises from "fs/promises";
import * as Constants from "./constants";
import childProcess from "child_process";
import fs from "node:fs";
import { ConnectionString } from "mongodb-connection-string-url";
import { readEnvFile } from "./env-file";

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
  console.log("\tefl, enable-form-login\t\tEnable form login.\r");
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

export function parseRedisUrl(redisUrlObject) {
  if (redisUrlObject && redisUrlObject !== "undefined") {
    try {
      const redisUrl = new URL(redisUrlObject);

      return redisUrl.hostname;
    } catch (err) {
      console.error("Error parsing redis URL:", err);
    }
  }

  return null;
}

/**
 * Reads the raw APPSMITH_REDIS_URL value, from the environment first and the
 * env file second. Returns null when it is not set.
 */
export function readRedisUrlSetting(): string | null {
  const fromEnv = process.env.APPSMITH_REDIS_URL;

  if (fromEnv && fromEnv !== "undefined") {
    return fromEnv;
  }

  try {
    const env_array = fs
      .readFileSync(Constants.ENV_PATH, "utf8")
      .toString()
      .split("\n");

    for (const i in env_array) {
      if (env_array[i].startsWith("APPSMITH_REDIS_URL")) {
        return env_array[i].substring(env_array[i].indexOf("=") + 1).trim();
      }
    }
  } catch (err) {
    console.error("Error reading the environment file:", err);
  }

  return null;
}

/**
 * Hostname of the configured Redis. Use getRedisCliConnection() when the value is
 * passed to redis-cli, so credentials, port and TLS are preserved.
 */
export function getRedisUrl() {
  const redisUrlObject = readRedisUrlSetting();

  if (redisUrlObject) {
    try {
      return parseRedisUrl(redisUrlObject);
    } catch (err) {
      console.error("Error parsing redis URL:", err);
    }
  }

  return null;
}

export interface RedisCliConnection {
  /** redis-cli flags: host, port, and when present --tls and --user. */
  args: string[];
  /** Password for REDISCLI_AUTH, or null when the URL carries none. */
  password: string | null;
}

/**
 * Splits a configured Redis URL into redis-cli flags plus the password. The
 * password is returned separately so callers can hand it to redis-cli through
 * the REDISCLI_AUTH environment variable instead of the command line, where it
 * would be visible in the process table. Accepts redis, rediss (TLS) and the
 * server-only redis-cluster scheme, or a bare host / host:port. Returns null
 * when the value is empty.
 */
export function toRedisCliConnection(
  redisUrl: string | undefined,
): RedisCliConnection | null {
  const value = (redisUrl ?? "").trim();

  if (!value || value === "undefined") {
    return null;
  }

  const url = new URL(value.includes("://") ? value : `redis://${value}`);
  const args = ["-h", url.hostname, "-p", url.port || "6379"];

  if (url.protocol === "rediss:") {
    args.push("--tls");
  }

  if (url.username) {
    args.push("--user", decodeURIComponent(url.username));
  }

  return {
    args,
    password: url.password ? decodeURIComponent(url.password) : null,
  };
}

export function getRedisCliConnection(): RedisCliConnection | null {
  return toRedisCliConnection(readRedisUrlSetting());
}

/** Environment for a redis-cli child process, with the password in REDISCLI_AUTH. */
export function redisCliEnv(redis: RedisCliConnection): NodeJS.ProcessEnv {
  return redis.password
    ? { ...process.env, REDISCLI_AUTH: redis.password }
    : { ...process.env };
}

export function getDburl() {
  for (const name of [
    "APPSMITH_DB_URL",
    "APPSMITH_MONGODB_URI",
    "APPSMITH_MONGO_DB_URI",
  ]) {
    const value = process.env[name]?.trim();

    if (value && value !== "undefined") return value;
  }

  const configuration = readEnvFile(Constants.ENV_PATH);

  return (
    configuration.APPSMITH_DB_URL || configuration.APPSMITH_MONGODB_URI || ""
  );
}

export async function execCommand(cmd: string[], options?) {
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

export async function execCommandReturningOutput(cmd, options?) {
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

export async function execCommandSilent(cmd, options?) {
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
