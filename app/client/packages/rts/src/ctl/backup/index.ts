import fsPromises from "fs/promises";
import * as utils from "../utils";
import * as Constants from "../constants";
import * as logger from "../logger";
import * as mailer from "../mailer";
import type { Link } from "./links";
import * as linkClasses from "./links";
import { BackupState } from "./BackupState";

export async function run(args: string[]) {
  await utils.ensureSupervisorIsRunning();

  const state: BackupState = new BackupState(args);

  const chain: Link[] = [
    new linkClasses.BackupFolderLink(state),
    new linkClasses.DiskSpaceLink(),
    new linkClasses.ManifestLink(state),
    new linkClasses.MongoDumpLink(state),
    new linkClasses.GitStorageLink(state),
    new linkClasses.EnvFileLink(state),

    // Encryption link is best placed last so if any of the above links fail, we don't ask the user for a password and
    // then do nothing with it.
    new linkClasses.EncryptionLink(state),
  ];

  try {
    // PRE-BACKUP
    for (const link of chain) {
      await link.preBackup?.();
    }

    // BACKUP
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
  const backupArchivesLimit = parseInt(
    process.env.APPSMITH_BACKUP_ARCHIVE_LIMIT || "4",
    10,
  );
  const backupFiles = await utils.listLocalBackupFiles();

  await removeOldBackups(backupFiles, backupArchivesLimit);

  console.log("Cleanup completed.");
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
