import type { Link } from ".";
import type { BackupState } from "../BackupState";
import fsPromises from "fs/promises";
import path from "path";
import os from "os";

/**
 * Creates the backup folder in pre step, and deletes it in post step. The existence of the backup folder should only
 * be assumed in the "doBackup" step, and no other.
 */
export class BackupFolderLink implements Link {
  constructor(private readonly state: BackupState) {}

  async preBackup() {
    this.state.backupRootPath = await fsPromises.mkdtemp(
      path.join(os.tmpdir(), "appsmithctl-backup-"),
    );
  }

  async postBackup() {
    await fsPromises.rm(this.state.backupRootPath, {
      recursive: true,
      force: true,
    });
  }
}
