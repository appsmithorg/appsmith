import type { Link } from ".";
import type { BackupState } from "../BackupState";
import * as utils from "../../utils";

/**
 * Exports the MongoDB database data using mongodump.
 */
export class MongoDumpLink implements Link {
  constructor(private readonly state: BackupState) {}

  async doBackup() {
    const url = this.state.dbUrl;

    if (url.startsWith("mongodb")) {
      console.log("Exporting database");
      await executeMongoDumpCMD(this.state.backupRootPath, url);
      console.log("Exporting database done.");
    }
  }
}

export async function executeMongoDumpCMD(destFolder: string, dbUrl: string) {
  return await utils.execCommand([
    "mongodump",
    `--uri=${dbUrl}`,
    `--archive=${destFolder}/mongodb-data.gz`,
    "--gzip",
  ]);
}
