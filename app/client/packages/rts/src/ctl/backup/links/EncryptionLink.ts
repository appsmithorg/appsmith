import { Link } from "./index";
import tty from "tty";
import fsPromises from "fs/promises";
import { encryptBackupArchive, getEncryptionPasswordFromUser } from "../index";
import { BackupState } from "../BackupState";

export class EncryptionLink implements Link {
  constructor(private readonly state: BackupState) {
  }

  async preBackup() {
    if (
      !this.state.args.includes("--non-interactive") &&
      tty.isatty((process.stdout as any).fd)
    ) {
      this.state.encryptionPassword = getEncryptionPasswordFromUser();
    }
  }

  async postBackup() {
    if (!this.state.isEncryptionEnabled()) {
      return;
    }

    const unencryptedArchivePath = this.state.archivePath;

    this.state.archivePath = await encryptBackupArchive(
      unencryptedArchivePath,
      this.state.encryptionPassword,
    );

    await fsPromises.rm(unencryptedArchivePath, {
      recursive: true,
      force: true,
    });
  }
}
