import type { Link } from ".";
import type { BackupState } from "../BackupState";
import * as utils from "../../utils";

interface ConnectionDetails {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

/**
 * Backup & restore for Postgres database data using `pg_dump` and `psql`.
 */
export class PostgresDumpLink implements Link {
  private postgresUrl: null | ConnectionDetails = null;

  constructor(private readonly state: BackupState) {}

  async preBackup() {
    const url = this.state.dbUrl;

    if (url.startsWith("postgresql")) {
      this.postgresUrl = parsePostgresUrl(url);

      return;
    }

    if (process.env.APPSMITH_KEYCLOAK_DB_URL) {
      const dbUrlFromEnv = process.env.APPSMITH_KEYCLOAK_DB_URL;

      if (dbUrlFromEnv.startsWith("postgresql://")) {
        this.postgresUrl = parsePostgresUrl(dbUrlFromEnv);
      } else if (dbUrlFromEnv.includes("/")) {
        // then it's just the hostname and database in there
        const [host, database] = dbUrlFromEnv.split("/");

        this.postgresUrl = {
          host,
          port: 5432,
          username: process.env.APPSMITH_KEYCLOAK_DB_USERNAME,
          password: process.env.APPSMITH_KEYCLOAK_DB_PASSWORD,
          database,
        };
      } else {
        // Identify this as an invalid value for this env variable.
        // But we ignore this fact for now, since Postgres itself is not a critical component yet.
        console.warn(
          "APPSMITH_KEYCLOAK_DB_URL is set, but it doesn't start with postgresql://. This is not a valid value for this env variable. But we ignore this fact for now, since Postgres itself is not a critical component yet.",
        );
      }
    } else if (process.env.APPSMITH_ENABLE_EMBEDDED_DB !== "0") {
      this.postgresUrl = {
        // Get unix_socket_directories from postgresql.conf, like in pg-utils.sh/get_unix_socket_directory.
        // Unix socket directory
        host: "/var/run/postgresql",
        port: 5432,
        username: "postgres",
        password: process.env.APPSMITH_TEMPORAL_PASSWORD,
        database: "appsmith",
      };
    } else {
      throw new Error("No Postgres DB URL found");
    }
  }

  async doBackup() {
    if (this.postgresUrl) {
      await executePostgresDumpCMD(this.state.backupRootPath, this.postgresUrl);
    }
  }

  async doRestore(restoreContentsPath: string) {
    const env = {
      ...process.env,
    };

    const cmd = ["psql", "-v", "ON_ERROR_STOP=1"];

    const isLocalhost = ["localhost", "127.0.0.1"].includes(
      this.postgresUrl.host,
    );

    if (isLocalhost) {
      env.PGHOST = "/var/run/postgresql";
      env.PGPORT = "5432";
      env.PGUSER = "postgres";
      env.PGPASSWORD = process.env.APPSMITH_TEMPORAL_PASSWORD;
      env.PGDATABASE = this.postgresUrl.database;
    } else {
      env.PGHOST = this.postgresUrl.host;
      env.PGPORT = this.postgresUrl.port.toString();
      env.PGUSER = this.postgresUrl.username;
      env.PGPASSWORD = this.postgresUrl.password;
      env.PGDATABASE = this.postgresUrl.database;
    }

    await utils.execCommand(
      [
        ...cmd,
        "--command=DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS appsmith CASCADE; DROP SCHEMA IF EXISTS temporal CASCADE;",
      ],
      { env },
    );

    await utils.execCommand(
      [...cmd, `--file=${restoreContentsPath}/pg-data.sql`],
      { env },
    );
    console.log("Restoring Postgres database completed");
  }
}

function parsePostgresUrl(url: string): ConnectionDetails {
  const parsed = new URL(url);

  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "5432"),
    username: parsed.username,
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.substring(1),
  };
}

export async function executePostgresDumpCMD(
  destFolder: string,
  details: ConnectionDetails,
) {
  const args = [
    "pg_dump",
    `--host=${details.host}`,
    `--port=${details.port || "5432"}`,
    `--username=${details.username}`,
    `--dbname=${details.database}`,
    "--schema=appsmith",
    "--schema=public", // Keycloak
    "--schema=temporal",
    `--file=${destFolder}/pg-data.sql`,
    "--verbose",
    "--serializable-deferrable",
  ];

  // Set password in environment since it's not allowed in the CLI
  const env = {
    ...process.env,
    PGPASSWORD: details.password,
  };

  return await utils.execCommand(args, { env });
}
