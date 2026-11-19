import type { Link } from ".";
import type { BackupState } from "../BackupState";
import * as utils from "../../utils";

/**
 * Exports the MongoDB database data using mongodump.
 */
export class MongoDumpLink implements Link {
  constructor(private readonly state: BackupState) {}

  async doBackup() {
    const excluded = this.state.excludedCollections;

    if (excluded.length > 0) {
      console.log(
        "Excluding collections from database dump: " + excluded.join(", "),
      );
    }

    console.log("Exporting database");
    await executeMongoDumpCMD(
      this.state.backupRootPath,
      utils.getDburl(),
      excluded,
    );
    console.log("Exporting database done.");
  }
}

export async function executeMongoDumpCMD(
  destFolder: string,
  dbUrl: string,
  excludedCollections: readonly string[] = [],
) {
  return await utils.execCommand([
    "mongodump",
    `--uri=${dbUrl}`,
    `--archive=${destFolder}/mongodb-data.gz`,
    "--gzip",
    ...excludedCollections.map((name) => `--excludeCollection=${name}`),
  ]);
}
