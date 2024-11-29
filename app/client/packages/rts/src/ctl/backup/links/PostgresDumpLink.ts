import type { Link } from ".";
import type { BackupState } from "../BackupState";
import * as utils from "../../utils";

/**
 * Exports the Postgres database data using mongodump.
 */
export class PostgresDumpLink implements Link {
  constructor(private readonly state: BackupState) {}

  async doBackup() {
    const url = utils.getDburl();

    if (url.startsWith("postgresql")) {
      console.log("Exporting database");
      await executePostgresDumpCMD(this.state.backupRootPath, url);
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
    `--file=${destFolder}/pg-data.gz`,
  ]);
}
