import fsPromises from "fs/promises";
import path from "path";
import os from "os";
import readlineSync from "readline-sync";
import * as utils from "./utils";
import * as Constants from "./constants";

const command_args = process.argv.slice(3);

async function getBackupFileName() {
  const backupFiles = await utils.listLocalBackupFiles();

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

async function decryptArchive(
  encryptedFilePath: string,
  backupFilePath: string,
) {
  for (const attempt of [1, 2, 3]) {
    if (attempt > 1) {
      console.log("Retry attempt", attempt);
    }

    const decryptionPwd = readlineSync.question(
      "Enter the password to decrypt the backup archive: ",
      { hideEchoBack: true },
    );

    try {
      await utils.execCommandSilent([
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
        "-k",
        decryptionPwd,
      ]);

      return true;
    } catch (error) {
      console.log("Invalid password. Please try again:");
    }
  }

  return false;
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

  if (dbUrl.startsWith("mongodb")) {
    await restoreMongoDB(restoreContentsPath, dbUrl);
  } else if (dbUrl.includes("postgresql")) {
    await restorePostgres(restoreContentsPath, dbUrl);
  } else {
    throw new Error(
      "Unsupported database type, only MongoDB and Postgres are supported",
    );
  }

  console.log("Restoring database completed");
}

async function restoreMongoDB(restoreContentsPath: string, dbUrl: string) {
  const cmd = [
    "mongorestore",
    `--uri=${dbUrl}`,
    "--drop",
    `--archive=${restoreContentsPath}/mongodb-data.gz`,
    "--gzip",
  ];

  try {
    const fromDbName = await getBackupDatabaseName(restoreContentsPath);
    const toDbName = utils.getDatabaseNameFromUrl(dbUrl);

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

async function restorePostgres(restoreContentsPath: string, dbUrl: string) {
  const cmd = [
    "pg_restore",
    "--verbose",
    "--clean",
    `${restoreContentsPath}/pg-data.gz`,
  ];
  const url = new URL(dbUrl);
  const isLocalhost = ["localhost", "127.0.0.1"].includes(url.hostname);

  if (isLocalhost) {
    let dbName: string;

    try {
      dbName = utils.getDatabaseNameFromUrl(dbUrl);
      console.log("Restoring database to", dbName);
    } catch (error) {
      console.warn(
        "Error reading manifest file. Assuming same database name as appsmith.",
        error,
      );
      dbName = "appsmith";
    }
    cmd.push(
      "-d",
      "postgresql://localhost:5432/" + dbName,
      // Use default user for local postgres
      "--username=postgres",
    );
  } else {
    cmd.push("-d", dbUrl);
  }

  await utils.execCommand(cmd);
}

async function restoreDockerEnvFile(
  restoreContentsPath: string,
  backupName: string,
  overwriteEncryptionKeys: boolean,
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
    if (encryptionPwd && encryptionSalt) {
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

async function checkRestoreVersionCompatability(restoreContentsPath: string) {
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
    let backupFileName = await getBackupFileName();

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
        );

        if (!decryptSuccess) {
          console.log(
            "You have entered the incorrect password multiple times. Aborting the restore process.",
          );
          await fsPromises.rm(backupFilePath, { force: true });
          process.exit();
        }
      }

      const backupName = backupFileName.replace(/\.tar\.gz$/, "");
      const restoreRootPath = await fsPromises.mkdtemp(os.tmpdir());

      await extractArchive(backupFilePath, restoreRootPath);

      const restoreContentsPath = await figureOutContentsPath(restoreRootPath);

      await checkRestoreVersionCompatability(restoreContentsPath);

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
      );
      await restoreGitStorageArchive(restoreContentsPath, backupName);
      console.log("Appsmith instance successfully restored.");
      await fsPromises.rm(restoreRootPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.log(err);
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
