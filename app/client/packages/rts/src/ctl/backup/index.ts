import fsPromises from "fs/promises";
import path from "path";
import os from "os";
import * as utils from "../utils";
import * as Constants from "../constants";
import * as logger from "../logger";
import * as mailer from "../mailer";
import readlineSync from "readline-sync";
import { DiskSpaceLink } from "./links/DiskSpaceLink";
import type { Link } from "./links";
import { EncryptionLink, ManifestLink } from "./links";
import { BackupState } from "./BackupState";

export async function run(args: string[]) {
  await utils.ensureSupervisorIsRunning();

  const state: BackupState = new BackupState(args);

  const chain: Link[] = [
    new DiskSpaceLink(),
    new ManifestLink(state),
    new EncryptionLink(state),
  ];

  try {
    // PRE-BACKUP
    for (const link of chain) {
      await link.preBackup?.();
    }

    // BACKUP
    state.backupRootPath = await fsPromises.mkdtemp(
      path.join(os.tmpdir(), "appsmithctl-backup-"),
    );

    await exportDatabase(state.backupRootPath);

    await createGitStorageArchive(state.backupRootPath);

    await exportDockerEnvFile(
      state.backupRootPath,
      state.isEncryptionEnabled(),
    );

    for (const link of chain) {
      await link.doBackup?.();
    }

    state.archivePath = await createFinalArchive(
      state.backupRootPath,
      state.initAt,
    );

    // POST-BACKUP
    for (const link of chain) {
      await link.postBackup?.();
    }

    console.log("Post-backup done. Final archive at", state.archivePath);

    if (!state.isEncryptionEnabled()) {
      console.log(
        "********************************************************* IMPORTANT!!! *************************************************************",
      );
      console.log(
        "*** Please ensure you have saved the APPSMITH_ENCRYPTION_SALT and APPSMITH_ENCRYPTION_PASSWORD variables from the docker.env file **",
      );
      console.log(
        "*** These values are not included in the backup export.                                                                           **",
      );
      console.log(
        "************************************************************************************************************************************",
      );
    }

    await fsPromises.rm(state.backupRootPath, { recursive: true, force: true });

    await logger.backup_info(
      "Finished taking a backup at " + state.archivePath,
    );
  } catch (err) {
    process.exitCode = 1;
    await logger.backup_error(err.stack);

    if (state.args.includes("--error-mail")) {
      const currentTS = new Date().getTime();
      const lastMailTS = await utils.getLastBackupErrorMailSentInMilliSec();

      if (
        lastMailTS +
          Constants.DURATION_BETWEEN_BACKUP_ERROR_MAILS_IN_MILLI_SEC <
        currentTS
      ) {
        await mailer.sendBackupErrorToAdmins(err, state.initAt);
        await utils.updateLastBackupErrorMailSentInMilliSec(currentTS);
      }
    }

    // Delete the archive, if exists, since its existence may mislead the user.
    if (state.archivePath != null) {
      await fsPromises.rm(state.archivePath, {
        recursive: true,
        force: true,
      });
    }
  } finally {
    if (state.backupRootPath != null) {
      await fsPromises.rm(state.backupRootPath, {
        recursive: true,
        force: true,
      });
    }

    await postBackupCleanup();
    process.exit();
  }
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

async function exportDatabase(destFolder: string) {
  console.log("Exporting database");
  await executeMongoDumpCMD(destFolder, utils.getDburl());
  console.log("Exporting database done.");
}

async function createGitStorageArchive(destFolder: string) {
  console.log("Creating git-storage archive");

  const gitRoot = getGitRoot(process.env.APPSMITH_GIT_ROOT);

  await executeCopyCMD(gitRoot, destFolder);

  console.log("Created git-storage archive");
}

async function exportDockerEnvFile(
  destFolder: string,
  encryptArchive: boolean,
) {
  console.log("Exporting docker environment file");
  const content = await fsPromises.readFile(
    "/appsmith-stacks/configuration/docker.env",
    { encoding: "utf8" },
  );
  let cleaned_content = removeSensitiveEnvData(content);

  if (encryptArchive) {
    cleaned_content +=
      "\nAPPSMITH_ENCRYPTION_SALT=" +
      process.env.APPSMITH_ENCRYPTION_SALT +
      "\nAPPSMITH_ENCRYPTION_PASSWORD=" +
      process.env.APPSMITH_ENCRYPTION_PASSWORD;
  }

  await fsPromises.writeFile(destFolder + "/docker.env", cleaned_content);
  console.log("Exporting docker environment file done.");
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

async function createFinalArchive(destFolder: string, timestamp: string) {
  console.log("Creating final archive");

  const archive = `${Constants.BACKUP_PATH}/appsmith-backup-${timestamp}.tar.gz`;

  await utils.execCommand([
    "tar",
    "-cah",
    "-C",
    destFolder,
    "-f",
    archive,
    ".",
  ]);

  console.log("Created final archive");

  return archive;
}

async function postBackupCleanup() {
  console.log("Starting cleanup.");
  const backupArchivesLimit = getBackupArchiveLimit(
    parseInt(process.env.APPSMITH_BACKUP_ARCHIVE_LIMIT, 10),
  );
  const backupFiles = await utils.listLocalBackupFiles();

  await removeOldBackups(backupFiles, backupArchivesLimit);

  console.log("Cleanup completed.");
}

export async function executeCopyCMD(srcFolder: string, destFolder: string) {
  return await utils.execCommand([
    "ln",
    "-s",
    srcFolder,
    path.join(destFolder, "git-storage"),
  ]);
}

export function getGitRoot(gitRoot?: string | undefined) {
  if (gitRoot == null || gitRoot === "") {
    gitRoot = "/appsmith-stacks/git-storage";
  }

  return gitRoot;
}

export function getBackupContentsPath(
  backupRootPath: string,
  timestamp: string,
): string {
  return backupRootPath + "/appsmith-backup-" + timestamp;
}

export function removeSensitiveEnvData(content: string): string {
  // Remove encryption and Mongodb data from docker.env
  const output_lines = [];

  content.split(/\r?\n/).forEach((line) => {
    if (
      !line.startsWith("APPSMITH_ENCRYPTION") &&
      !line.startsWith("APPSMITH_MONGODB") &&
      !line.startsWith("APPSMITH_DB_URL=")
    ) {
      output_lines.push(line);
    }
  });

  return output_lines.join("\n");
}

export function getBackupArchiveLimit(backupArchivesLimit?: number): number {
  return backupArchivesLimit || Constants.APPSMITH_DEFAULT_BACKUP_ARCHIVE_LIMIT;
}

export async function removeOldBackups(
  backupFiles: string[],
  backupArchivesLimit: number,
) {
  return Promise.all(
    backupFiles
      .sort()
      .reverse()
      .slice(backupArchivesLimit)
      .map((file) => Constants.BACKUP_PATH + "/" + file)
      .map(async (file) => fsPromises.rm(file)),
  );
}

export function getTimeStampInISO() {
  return new Date().toISOString().replace(/:/g, "-");
}

export async function getAvailableBackupSpaceInBytes(
  path: string,
): Promise<number> {
  const stat = await fsPromises.statfs(path);

  return stat.bsize * stat.bfree;
}

export function checkAvailableBackupSpace(availSpaceInBytes: number) {
  if (availSpaceInBytes < Constants.MIN_REQUIRED_DISK_SPACE_IN_BYTES) {
    throw new Error(
      "Not enough space available at /appsmith-stacks. Please ensure availability of at least 2GB to backup successfully.",
    );
  }
}
