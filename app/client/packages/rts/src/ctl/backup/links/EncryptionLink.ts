import type { Link } from ".";
import tty from "tty";
import fsPromises from "fs/promises";
import type { BackupState } from "../BackupState";
import readlineSync from "readline-sync";
import * as utils from "../../utils";

/**
 * Asks the user for a password, and then encrypts the backup archive using openssl, with that password. If a TTY is not
 * available to ask for a password, then this feature is gracefully disabled, and encryption is not performed.
 */
export class EncryptionLink implements Link {
  #password: string = "";

  constructor(private readonly state: BackupState) {}

  async preBackup() {
    if (
      !this.state.args.includes("--non-interactive") &&
      tty.isatty((process.stdout as any).fd)
    ) {
      this.#password = getEncryptionPasswordFromUser();
    }

    this.state.isEncryptionEnabled = !!this.#password;
  }

  async postBackup() {
    if (!this.#password) {
      return;
    }

    const unencryptedArchivePath = this.state.archivePath;

    this.state.archivePath = await encryptBackupArchive(
      unencryptedArchivePath,
      this.#password,
    );

    await fsPromises.rm(unencryptedArchivePath, {
      recursive: true,
      force: true,
    });
  }
}

export function getEncryptionPasswordFromUser(): string {
  for (const attempt of [1, 2, 3]) {
    if (attempt > 1) {
      console.log("Retry attempt", attempt);
    }

    const encryptionPwd1: string = readlineSync.question(
      "Enter a password to encrypt the backup archive: ",
      { hideEchoBack: true },
    );
    const encryptionPwd2: string = readlineSync.question(
      "Enter the above password again: ",
      { hideEchoBack: true },
    );

    if (encryptionPwd1 === encryptionPwd2) {
      if (encryptionPwd1) {
        return encryptionPwd1;
      }

      console.error(
        "Invalid input. Empty password is not allowed, please try again.",
      );
    } else {
      console.error("The passwords do not match, please try again.");
    }
  }

  console.error(
    "Aborting backup process, failed to obtain valid encryption password.",
  );

  throw new Error(
    "Backup process aborted because a valid encryption password could not be obtained from the user",
  );
}

export async function encryptBackupArchive(
  archivePath: string,
  encryptionPassword: string,
) {
  const encryptedArchivePath = archivePath + ".enc";

  await utils.execCommand([
    "openssl",
    "enc",
    "-aes-256-cbc",
    "-pbkdf2",
    "-iter",
    "100000",
    "-in",
    archivePath,
    "-out",
    encryptedArchivePath,
    "-k",
    encryptionPassword,
  ]);

  return encryptedArchivePath;
}
