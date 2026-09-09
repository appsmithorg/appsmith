import fsPromises from "fs/promises";
import path from "path";
import os from "os";
import readlineSync from "readline-sync";
import * as utils from "./utils";
import * as Constants from "./constants";

const command_args = process.argv.slice(3);

export function isNonInteractive(args: readonly string[]) {
  return args.includes("--non-interactive");
}

function getArgValue(args: readonly string[], name: string) {
  const prefix = `--${name}=`;
  const arg = args.find((a) => a.startsWith(prefix));

  return arg?.substring(prefix.length);
}

export async function getBackupFileName(args: readonly string[]) {
  const backupFiles = await utils.listLocalBackupFiles();
  const requestedFile = getArgValue(args, "backup-file");

  if (requestedFile) {
    if (path.basename(requestedFile) !== requestedFile) {
      throw new Error(
        "Invalid --backup-file value: it must be a file name, not a path.",
      );
    }

    if (backupFiles.includes(requestedFile)) {
      return requestedFile;
    }

    throw new Error(
      'Backup file "' +
        requestedFile +
        '" was not found in ' +
        Constants.BACKUP_PATH +
        ".",
    );
  }

  if (isNonInteractive(args)) {
    throw new Error(
      "Non-interactive restore requires --backup-file=<name> to select the backup archive.",
    );
  }

  console.log(
    "\n" +
      backupFiles.length +
      " Appsmith backup file(s) found: [Sorted in ascending/chronological order]",
  );

  if (backupFiles.length == 0) {
    return;
  }

  console.log(
    "----------------------------------------------------------------",
  );
  console.log("Index\t|\tAppsmith Backup Archive File");
  console.log(
    "----------------------------------------------------------------",
  );

  for (let i = 0; i < backupFiles.length; i++) {
    if (i === backupFiles.length - 1)
      console.log(i + "\t|\t" + backupFiles[i] + " <--Most recent backup");
    else console.log(i + "\t|\t" + backupFiles[i]);
  }

  console.log(
    "----------------------------------------------------------------",
  );

  const backupFileIndex = parseInt(
    readlineSync.question("Please enter the backup file index: "),
    10,
  );

  if (
    !isNaN(backupFileIndex) &&
    Number.isInteger(backupFileIndex) &&
    backupFileIndex >= 0 &&
    backupFileIndex < backupFiles.length
  ) {
    return backupFiles[backupFileIndex];
  } else {
    console.log(
      "Invalid input, please try the command again with a valid option",
    );
  }
}

export async function decryptArchive(
  encryptedFilePath: string,
  backupFilePath: string,
  args: readonly string[],
) {
  const envPassword = process.env.APPSMITH_BACKUP_ARCHIVE_PASSWORD;

  if (envPassword) {
    try {
      await runDecryptCommand(encryptedFilePath, backupFilePath, envPassword);

      return true;
    } catch (error) {
      console.error(
        "Failed to decrypt the backup archive using APPSMITH_BACKUP_ARCHIVE_PASSWORD: the password is wrong or the archive is unreadable.",
      );

      return false;
    }
  }

  if (isNonInteractive(args)) {
    console.error(
      "The backup archive is encrypted. Set APPSMITH_BACKUP_ARCHIVE_PASSWORD to decrypt it in non-interactive mode.",
    );

    return false;
  }

  for (const attempt of [1, 2, 3]) {
    if (attempt > 1) {
      console.log("Retry attempt", attempt);
    }

    const decryptionPwd = readlineSync.question(
      "Enter the password to decrypt the backup archive: ",
      { hideEchoBack: true },
    );

    try {
      await runDecryptCommand(encryptedFilePath, backupFilePath, decryptionPwd);

      return true;
    } catch (error) {
      console.log("Invalid password. Please try again:");
    }
  }

  return false;
}

async function runDecryptCommand(
  encryptedFilePath: string,
  backupFilePath: string,
  password: string,
) {
  // The password is passed through the child environment instead of argv, so
  // it is not visible in the process table while openssl runs.
  return utils.execCommandSilent(
    [
      "openssl",
      "enc",
      "-d",
      "-aes-256-cbc",
      "-pbkdf2",
      "-iter",
      "100000",
      "-in",
      encryptedFilePath,
      "-out",
      backupFilePath,
      "-pass",
      "env:APPSMITH_BACKUP_ARCHIVE_PASSWORD",
    ],
    {
      env: { ...process.env, APPSMITH_BACKUP_ARCHIVE_PASSWORD: password },
    },
  );
}

export function ensureEncryptionKeysPresent() {
  if (
    !(
      process.env.APPSMITH_ENCRYPTION_PASSWORD &&
      process.env.APPSMITH_ENCRYPTION_SALT
    )
  ) {
    throw new Error(
      "Non-interactive restore of an unencrypted backup archive requires APPSMITH_ENCRYPTION_PASSWORD and APPSMITH_ENCRYPTION_SALT to be set.",
    );
  }
}

async function extractArchive(backupFilePath: string, restoreRootPath: string) {
  console.log("Extracting the Appsmith backup archive at " + backupFilePath);
  await utils.execCommand([
    "tar",
    "-C",
    restoreRootPath,
    "-xf",
    backupFilePath,
  ]);
  console.log("Extracting the backup archive completed");
}

async function restoreDatabase(restoreContentsPath: string, dbUrl: string) {
  console.log("Restoring database...");
  const cmd = [
    "mongorestore",
    `--uri=${dbUrl}`,
    "--drop",
    `--archive=${restoreContentsPath}/mongodb-data.gz`,
    "--gzip",
  ];

  try {
    const fromDbName = await getBackupDatabaseName(restoreContentsPath);
    const toDbName = utils.getDatabaseNameFromMongoURI(dbUrl);

    console.log("Restoring database from " + fromDbName + " to " + toDbName);
    cmd.push(
      "--nsInclude=*",
      `--nsFrom=${fromDbName}.*`,
      `--nsTo=${toDbName}.*`,
    );
  } catch (error) {
    console.warn(
      "Error reading manifest file. Assuming same database name.",
      error,
    );
  }
  await utils.execCommand(cmd);
  console.log("Restoring database completed");
}

async function restoreDockerEnvFile(
  restoreContentsPath: string,
  backupName: string,
  overwriteEncryptionKeys: boolean,
  args: readonly string[],
) {
  console.log("Restoring docker environment file");
  const dockerEnvFile = "/appsmith-stacks/configuration/docker.env";
  const updatedbUrl = utils.getDburl();
  let encryptionPwd = process.env.APPSMITH_ENCRYPTION_PASSWORD;
  let encryptionSalt = process.env.APPSMITH_ENCRYPTION_SALT;

  await utils.execCommand([
    "cp",
    dockerEnvFile,
    dockerEnvFile + "." + backupName,
  ]);

  let dockerEnvContent = await fsPromises.readFile(
    restoreContentsPath + "/docker.env",
    "utf8",
  );

  if (overwriteEncryptionKeys) {
    if (isNonInteractive(args)) {
      ensureEncryptionKeysPresent();
      console.log(
        "Restoring docker environment file with the encryption password & salt from the current environment",
      );
    } else if (encryptionPwd && encryptionSalt) {
      const input = readlineSync.question(
        'If you are restoring to the same Appsmith deployment which generated the backup archive, you can use the existing encryption keys on the instance.\n\
      Press Enter to continue with existing encryption keys\n\
      Or Type "n"/"No" to provide encryption key & password corresponding to the original Appsmith instance that is being restored.\n',
      );
      const answer = input && input.toLocaleUpperCase();

      if (answer === "N" || answer === "NO") {
        encryptionPwd = readlineSync.question(
          "Enter the APPSMITH_ENCRYPTION_PASSWORD: ",
          {
            hideEchoBack: true,
          },
        );
        encryptionSalt = readlineSync.question(
          "Enter the APPSMITH_ENCRYPTION_SALT: ",
          {
            hideEchoBack: true,
          },
        );
      } else {
        console.log(
          "Restoring docker environment file with existing encryption password & salt",
        );
      }
    } else {
      encryptionPwd = readlineSync.question(
        "Enter the APPSMITH_ENCRYPTION_PASSWORD: ",
        {
          hideEchoBack: true,
        },
      );
      encryptionSalt = readlineSync.question(
        "Enter the APPSMITH_ENCRYPTION_SALT: ",
        {
          hideEchoBack: true,
        },
      );
    }

    dockerEnvContent +=
      "\nAPPSMITH_ENCRYPTION_PASSWORD=" +
      encryptionPwd +
      "\nAPPSMITH_ENCRYPTION_SALT=" +
      encryptionSalt +
      "\nAPPSMITH_DB_URL=" +
      utils.getDburl() +
      "\nAPPSMITH_MONGODB_USER=" +
      process.env.APPSMITH_MONGODB_USER +
      "\nAPPSMITH_MONGODB_PASSWORD=" +
      process.env.APPSMITH_MONGODB_PASSWORD;
  } else {
    dockerEnvContent +=
      "\nAPPSMITH_DB_URL=" +
      updatedbUrl +
      "\nAPPSMITH_MONGODB_USER=" +
      process.env.APPSMITH_MONGODB_USER +
      "\nAPPSMITH_MONGODB_PASSWORD=" +
      process.env.APPSMITH_MONGODB_PASSWORD;
  }

  // Preserve the restoring instance's Redis configuration. The backup strips
  // these (see `removeSensitiveEnvData`) because the source instance's Redis
  // password does not match the target's embedded Redis `requirepass`.
  if (process.env.APPSMITH_REDIS_URL) {
    dockerEnvContent +=
      "\nAPPSMITH_REDIS_URL=" + process.env.APPSMITH_REDIS_URL;
  }

  if (process.env.APPSMITH_REDIS_PASSWORD) {
    dockerEnvContent +=
      "\nAPPSMITH_REDIS_PASSWORD=" + process.env.APPSMITH_REDIS_PASSWORD;
  }

  await fsPromises.writeFile(dockerEnvFile, dockerEnvContent, "utf8");

  console.log("Restoring docker environment file completed");
}

async function restoreGitStorageArchive(
  restoreContentsPath: string,
  backupName: string,
) {
  console.log("Restoring git-storage archive");
  const gitRoot = "/appsmith-stacks/git-storage";

  await utils.execCommand(["mv", gitRoot, gitRoot + "-" + backupName]);
  await utils.execCommand([
    "mv",
    restoreContentsPath + "/git-storage",
    "/appsmith-stacks",
  ]);
  console.log("Restoring git-storage archive completed");
}

export async function checkRestoreVersionCompatability(
  restoreContentsPath: string,
  args: readonly string[],
) {
  const currentVersion = await utils.getCurrentAppsmithVersion();
  const manifest_data = await fsPromises.readFile(
    path.join(restoreContentsPath, "manifest.json"),
    "utf8",
  );
  const manifest_json = JSON.parse(manifest_data);
  const restoreVersion = manifest_json["appsmithVersion"];

  console.log("Current Appsmith Version: " + currentVersion);
  console.log("Restore Appsmith Version: " + restoreVersion);

  if (currentVersion === restoreVersion) {
    console.log(
      "The restore instance is compatible with the current appsmith version",
    );
  } else {
    console.log(
      "**************************** WARNING ****************************",
    );
    console.log(
      "The Appsmith instance to be restored is not compatible with the current version.",
    );
    console.log(
      "Please update your appsmith image to 'index.docker.io/appsmith/appsmith-ce:" +
        restoreVersion +
        "' in the 'docker-compose.yml' file\nand run the cmd: 'docker-compose restart' " +
        "after the restore process is completed, to ensure the restored instance runs successfully.",
    );

    if (isNonInteractive(args)) {
      if (args.includes("--force")) {
        console.log(
          "--force is set, continuing with the restore despite the version mismatch.",
        );

        return;
      }

      throw new Error(
        "Restore aborted: the backup archive's Appsmith version does not match the current version. Re-run with --force to restore anyway.",
      );
    }

    const confirm = readlineSync.question(
      'Press Enter to continue \nOr Type "c" to cancel the restore process.\n',
    );

    if (confirm.toLowerCase() === "c") {
      process.exit(0);
    }
  }
}

async function getBackupDatabaseName(restoreContentsPath: string) {
  let db_name = "appsmith";

  if (command_args.includes("--backup-db-name")) {
    for (let i = 0; i < command_args.length; i++) {
      if (command_args[i].startsWith("--backup-db-name")) {
        db_name = command_args[i].split("=")[1];
      }
    }
  } else {
    const manifest_data = await fsPromises.readFile(
      restoreContentsPath + "/manifest.json",
      { encoding: "utf8" },
    );
    const manifest_json = JSON.parse(manifest_data);

    if ("dbName" in manifest_json) {
      db_name = manifest_json["dbName"];
    }
  }

  console.log("Backup Database Name: " + db_name);

  return db_name;
}

export async function run() {
  let cleanupArchive = false;
  let overwriteEncryptionKeys = true;
  let backupFilePath: string;

  await utils.ensureSupervisorIsRunning();

  try {
    let backupFileName = await getBackupFileName(command_args);

    if (backupFileName == null) {
      process.exit();
    } else {
      backupFilePath = path.join(Constants.BACKUP_PATH, backupFileName);

      if (isArchiveEncrypted(backupFileName)) {
        const encryptedBackupFilePath = path.join(
          Constants.BACKUP_PATH,
          backupFileName,
        );

        backupFileName = backupFileName.replace(".enc", "");
        backupFilePath = path.join(Constants.BACKUP_PATH, backupFileName);
        cleanupArchive = true;
        overwriteEncryptionKeys = false;
        const decryptSuccess = await decryptArchive(
          encryptedBackupFilePath,
          backupFilePath,
          command_args,
        );

        if (!decryptSuccess) {
          console.error(
            "Failed to decrypt the backup archive. Aborting the restore process.",
          );
          await fsPromises.rm(backupFilePath, { force: true });
          process.exit(1);
        }
      }

      if (isNonInteractive(command_args) && overwriteEncryptionKeys) {
        // Fail before services are stopped or the database is touched.
        ensureEncryptionKeysPresent();
      }

      const backupName = backupFileName.replace(/\.tar\.gz$/, "");
      const restoreRootPath = await fsPromises.mkdtemp(os.tmpdir());

      await extractArchive(backupFilePath, restoreRootPath);

      const restoreContentsPath = await figureOutContentsPath(restoreRootPath);

      await checkRestoreVersionCompatability(restoreContentsPath, command_args);

      console.log(
        "****************************************************************",
      );
      console.log(
        "Restoring Appsmith instance from the backup at " + backupFilePath,
      );
      await utils.stop(["backend", "rts"]);
      await restoreDatabase(restoreContentsPath, utils.getDburl());
      await restoreDockerEnvFile(
        restoreContentsPath,
        backupName,
        overwriteEncryptionKeys,
        command_args,
      );
      await restoreGitStorageArchive(restoreContentsPath, backupName);
      console.log("Appsmith instance successfully restored.");
      await fsPromises.rm(restoreRootPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    if (cleanupArchive) {
      await fsPromises.rm(backupFilePath, { force: true });
    }

    await utils.start(["backend", "rts"]);
    process.exit();
  }
}

function isArchiveEncrypted(backupFilePath: string) {
  return backupFilePath.endsWith(".enc");
}

async function figureOutContentsPath(root: string): Promise<string> {
  const subfolders = await fsPromises.readdir(root, { withFileTypes: true });

  try {
    // Check if the root itself contains the contents.
    await fsPromises.access(path.join(root, "manifest.json"));

    return root;
  } catch (error) {
    // Ignore
  }

  for (const subfolder of subfolders) {
    if (subfolder.isDirectory()) {
      try {
        // Try to find the `manifest.json` file.
        await fsPromises.access(
          path.join(root, subfolder.name, "manifest.json"),
        );

        return path.join(root, subfolder.name);
      } catch (error) {
        // Ignore
      }

      try {
        // If that fails, look for the MongoDB data archive, since backups from v1.7.x and older won't have `manifest.json`.
        await fsPromises.access(
          path.join(root, subfolder.name, "mongodb-data.gz"),
        );

        return path.join(root, subfolder.name);
      } catch (error) {
        // Ignore
      }
    }
  }

  throw new Error("Could not find the contents of the backup archive.");
}
