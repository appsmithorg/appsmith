import type { Link } from "./index";
import type { BackupState } from "../BackupState";
import fsPromises from "fs/promises";
import path from "path";
import os from "os";

export class BackupFolderLink implements Link {
  constructor(private readonly state: BackupState) {}

  async preBackup() {
    this.state.backupRootPath = await fsPromises.mkdtemp(
      path.join(os.tmpdir(), "appsmithctl-backup-"),
    );
  }

  async postBackup() {
    await fsPromises.rm(this.state.backupRootPath, { recursive: true, force: true });
  }
}

