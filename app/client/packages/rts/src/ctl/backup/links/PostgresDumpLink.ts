import type { Link } from ".";
import type { BackupState } from "../BackupState";
import * as utils from "../../utils";

/**
 * Exports the Postgres database data using pg_dump.
 */
export class PostgresDumpLink implements Link {
  private postgresUrl: null | string = null;

  constructor(private readonly state: BackupState) {}

  async preBackup() {
    const url = this.state.dbUrl;

    if (url.startsWith("postgresql")) {
      this.postgresUrl = url;

      return;
    }

    if (process.env.APPSMITH_KEYCLOAK_DB_URL) {
      this.postgresUrl = `postgresql://${process.env.APPSMITH_KEYCLOAK_DB_USERNAME}:${process.env.APPSMITH_KEYCLOAK_DB_PASSWORD}@${process.env.APPSMITH_KEYCLOAK_DB_URL}`;
    } else {
      throw new Error("No Postgres DB URL found");
    }
  }

  async doBackup() {
    if (this.postgresUrl) {
      console.log("Exporting database");
      await executePostgresDumpCMD(this.state.backupRootPath, this.postgresUrl);
      console.log("Exporting database done.");
    }
  }
}

export async function executePostgresDumpCMD(
  destFolder: string,
  dbUrl: string,
) {
  return await utils.execCommand([
    "pg_dump",
    dbUrl,
    "--schema=appsmith",
    "--format=custom",
    `--file=${destFolder}/pg-data`,
  ]);
}
