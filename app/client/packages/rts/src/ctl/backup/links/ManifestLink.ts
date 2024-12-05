import type { Link } from ".";
import type { BackupState } from "../BackupState";
import * as utils from "../../utils";
import fsPromises from "fs/promises";
import path from "path";

/**
 * Creates a manifest file that contains metadata about the backup.
 */
export class ManifestLink implements Link {
  constructor(private readonly state: BackupState) {}

  async doBackup() {
    const version = await utils.getCurrentAppsmithVersion();
    const manifestData = {
      appsmithVersion: version,
      dbName: utils.getDatabaseNameFromMongoURI(utils.getDburl()),
    };

    await fsPromises.writeFile(
      path.join(this.state.backupRootPath, "/manifest.json"),
      JSON.stringify(manifestData, null, 2),
    );
  }
}
