import type { Link } from "./index";
import type { BackupState } from "../BackupState";
import * as utils from "../../utils";

export class MongoDumpLink implements Link {
  constructor(private readonly state: BackupState) {}

  async doBackup() {
    await exportDatabase(this.state.backupRootPath);
  }
}

export async function executeMongoDumpCMD(
  destFolder: string,
  appsmithMongoURI: string,
) {
  return await utils.execCommand([
    "mongodump",
    `--uri=${appsmithMongoURI}`,
    `--archive=${destFolder}/mongodb-data.gz`,
    "--gzip",
  ]); // generate cmd
}

async function exportDatabase(destFolder: string) {
  console.log("Exporting database");
  await executeMongoDumpCMD(destFolder, utils.getDburl());
  console.log("Exporting database done.");
}
