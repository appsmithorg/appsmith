import fsPromises from "fs/promises";
import * as backup from ".";
import * as Constants from "../constants";
import * as utils from "../utils";
import readlineSync from "readline-sync";
import {
  checkAvailableBackupSpace,
  encryptBackupArchive,
  executeCopyCMD,
  executeMongoDumpCMD,
  executePostgresDumpCMD,
  getAvailableBackupSpaceInBytes,
  getEncryptionPasswordFromUser,
  getGitRoot,
  removeSensitiveEnvData,
} from "./links";

jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  execCommand: jest.fn().mockImplementation(async (a) => a.join(" ")),
}));

describe("Backup Tests", () => {
  test("Available Space in /appsmith-stacks volume in Bytes", async () => {
    const res = expect(await getAvailableBackupSpaceInBytes("/"));

    res.toBeGreaterThan(1024 * 1024);
  });

  it("Check the constant is 2 GB", () => {
    const size = 2 * 1024 * 1024 * 1024;

    expect(Constants.MIN_REQUIRED_DISK_SPACE_IN_BYTES).toBe(size);
  });

  it("Should throw Error when the available size is below MIN_REQUIRED_DISK_SPACE_IN_BYTES", () => {
    const size = Constants.MIN_REQUIRED_DISK_SPACE_IN_BYTES - 1;

    expect(() => checkAvailableBackupSpace(size)).toThrow();
  });

  it("Should not should throw Error when the available size is >= MIN_REQUIRED_DISK_SPACE_IN_BYTES", () => {
    expect(() => {
      checkAvailableBackupSpace(Constants.MIN_REQUIRED_DISK_SPACE_IN_BYTES);
    }).not.toThrow(
      "Not enough space available at /appsmith-stacks. Please ensure availability of at least 5GB to backup successfully.",
    );
  });

  test("Test backup contents path generation", () => {
    const root = "/rootDir";
    const timestamp = "0000-00-0T00-00-00.00Z";

    expect(backup.getBackupContentsPath(root, timestamp)).toBe(
      "/rootDir/appsmith-backup-0000-00-0T00-00-00.00Z",
    );
  });

  test("Test mongodump CMD generation", async () => {
    const dest = "/dest";
    const appsmithMongoURI = "mongodb://username:password@host/appsmith";
    const cmd =
      "mongodump --uri=mongodb://username:password@host/appsmith --archive=/dest/mongodb-data.gz --gzip";
    const res = await executeMongoDumpCMD(dest, appsmithMongoURI);

    expect(res).toBe(cmd);
    console.log(res);
  });

  test("Test postgres dump CMD generation", async () => {
    const dest = "/dest";
    const url = "postgresql://username:password@host/appsmith";
    const cmd =
      "pg_dump postgresql://username:password@host/appsmith ---schema=appsmith --format=custom --file=/dest/pg-data.gz";
    const res = await executePostgresDumpCMD(dest, url);

    expect(res).toBe(cmd);
    console.log(res);
  });

  test("Test get gitRoot path when APPSMITH_GIT_ROOT is '' ", () => {
    expect(getGitRoot("")).toBe("/appsmith-stacks/git-storage");
  });

  test("Test get gitRoot path when APPSMITH_GIT_ROOT is null ", () => {
    expect(getGitRoot()).toBe("/appsmith-stacks/git-storage");
  });

  test("Test get gitRoot path when APPSMITH_GIT_ROOT is defined ", () => {
    expect(getGitRoot("/my/git/storage")).toBe("/my/git/storage");
  });

  test("Test ln command generation", async () => {
    const gitRoot = "/appsmith-stacks/git-storage";
    const dest = "/destdir";
    const cmd = "ln -s /appsmith-stacks/git-storage /destdir/git-storage";
    const res = await executeCopyCMD(gitRoot, dest);

    expect(res).toBe(cmd);
    console.log(res);
  });

  it("Checks for the current Appsmith Version.", async () => {
    fsPromises.readFile = jest.fn().mockImplementation(async (path) => {
      if (path === "/opt/appsmith/info.json") {
        return `{"version": "v0.0.0-SNAPSHOT"}`;
      } else {
        throw new Error("Unexpected file to read: " + path);
      }
    });
    const res = await utils.getCurrentAppsmithVersion();

    expect(res).toBe("v0.0.0-SNAPSHOT");
  });

  test("If MONGODB and Encryption env values are being removed", () => {
    expect(
      removeSensitiveEnvData(`APPSMITH_REDIS_URL=redis://127.0.0.1:6379\nAPPSMITH_DB_URL=mongodb://appsmith:pass@localhost:27017/appsmith\nAPPSMITH_MONGODB_USER=appsmith\nAPPSMITH_MONGODB_PASSWORD=pass\nAPPSMITH_INSTANCE_NAME=Appsmith\n
  `),
    ).toMatch(
      `APPSMITH_REDIS_URL=redis://127.0.0.1:6379\nAPPSMITH_INSTANCE_NAME=Appsmith\n`,
    );
  });

  test("If MONGODB and Encryption env values are being removed", () => {
    expect(
      removeSensitiveEnvData(`APPSMITH_REDIS_URL=redis://127.0.0.1:6379\nAPPSMITH_ENCRYPTION_PASSWORD=dummy-pass\nAPPSMITH_ENCRYPTION_SALT=dummy-salt\nAPPSMITH_DB_URL=mongodb://appsmith:pass@localhost:27017/appsmith\nAPPSMITH_MONGODB_USER=appsmith\nAPPSMITH_MONGODB_PASSWORD=pass\nAPPSMITH_INSTANCE_NAME=Appsmith\n
  `),
    ).toMatch(
      `APPSMITH_REDIS_URL=redis://127.0.0.1:6379\nAPPSMITH_INSTANCE_NAME=Appsmith\n`,
    );
  });

  test("Backup Archive Limit when env APPSMITH_BACKUP_ARCHIVE_LIMIT is null", () => {
    expect(backup.getBackupArchiveLimit()).toBe(4);
  });

  test("Backup Archive Limit when env APPSMITH_BACKUP_ARCHIVE_LIMIT is 5", () => {
    expect(backup.getBackupArchiveLimit(5)).toBe(5);
  });

  test("Cleanup Backups when limit is 4 and there are 5 files", async () => {
    fsPromises.rm = jest.fn().mockImplementation();
    const backupFiles = ["file1", "file2", "file3", "file4", "file5"];

    await backup.removeOldBackups(backupFiles, 4);

    expect(fsPromises.rm).toHaveBeenCalledTimes(1);
    expect(fsPromises.rm).toHaveBeenCalledWith(
      Constants.BACKUP_PATH + "/file1",
    );
  });

  test("Cleanup Backups when limit is 2 and there are 5 files", async () => {
    fsPromises.rm = jest.fn().mockImplementation();
    const backupFiles = ["file1", "file4", "file3", "file2", "file5"];

    await backup.removeOldBackups(backupFiles, 2);

    expect(fsPromises.rm).toHaveBeenCalledTimes(3);
    expect(fsPromises.rm).toHaveBeenCalledWith(
      Constants.BACKUP_PATH + "/file1",
    );
    expect(fsPromises.rm).toHaveBeenCalledWith(
      Constants.BACKUP_PATH + "/file2",
    );
    expect(fsPromises.rm).toHaveBeenCalledWith(
      Constants.BACKUP_PATH + "/file3",
    );
  });

  test("Cleanup Backups when limit is 4 and there are 4 files", async () => {
    fsPromises.rm = jest.fn().mockImplementation();
    const backupFiles = ["file1", "file2", "file3", "file4"];

    await backup.removeOldBackups(backupFiles, 4);

    expect(fsPromises.rm).not.toHaveBeenCalled();
  });

  test("Cleanup Backups when limit is 4 and there are 2 files", async () => {
    fsPromises.rm = jest.fn().mockImplementation();
    const backupFiles = ["file1", "file2"];

    await backup.removeOldBackups(backupFiles, 4);

    expect(fsPromises.rm).not.toHaveBeenCalled();
  });

  test("Cleanup Backups when limit is 2 and there is 1 file", async () => {
    fsPromises.rm = jest.fn().mockImplementation();
    const backupFiles = ["file1"];

    await backup.removeOldBackups(backupFiles, 4);

    expect(fsPromises.rm).not.toHaveBeenCalled();
  });

  test("Cleanup Backups when limit is 2 and there is no file", async () => {
    const backupArchivesLimit = 4;

    fsPromises.rm = jest.fn().mockImplementation(async (a) => console.log(a));
    const backupFiles = [];
    const expectedBackupFiles = [];
    const res = await backup.removeOldBackups(backupFiles, backupArchivesLimit);

    console.log(res);
    expect(res).toEqual(expectedBackupFiles);
  });

  test("Test get encryption password from user prompt when both passwords are the same", async () => {
    const password = "password#4321";

    readlineSync.question = jest.fn().mockImplementation(() => password);
    const password_res = getEncryptionPasswordFromUser();

    expect(password_res).toEqual(password);
  });

  test("Test get encryption password from user prompt when both passwords are the different", async () => {
    const password = "password#4321";

    readlineSync.question = jest.fn().mockImplementation((a) => {
      if (a == "Enter the above password again: ") {
        return "pass";
      }

      return password;
    });

    expect(() => getEncryptionPasswordFromUser()).toThrow();
  });

  test("Get encrypted archive path", async () => {
    const archivePath = "/rootDir/appsmith-backup-0000-00-0T00-00-00.00Z";
    const encryptionPassword = "password#4321";
    const encArchivePath = await encryptBackupArchive(
      archivePath,
      encryptionPassword,
    );

    expect(encArchivePath).toEqual(
      "/rootDir/appsmith-backup-0000-00-0T00-00-00.00Z" + ".enc",
    );
  });

  test("Test backup encryption function", async () => {
    const archivePath = "/rootDir/appsmith-backup-0000-00-0T00-00-00.00Z";
    const encryptionPassword = "password#123";
    const res = await encryptBackupArchive(archivePath, encryptionPassword);

    console.log(res);
    expect(res).toEqual("/rootDir/appsmith-backup-0000-00-0T00-00-00.00Z.enc");
  });
});

test("Get DB name from Mongo URI 1", async () => {
  const mongodb_uri =
    "mongodb+srv://admin:password@test.cluster.mongodb.net/my_db_name?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin";
  const expectedDBName = "my_db_name";
  const dbName = utils.getDatabaseNameFromUrl(mongodb_uri);

  expect(dbName).toEqual(expectedDBName);
});

test("Get DB name from Mongo URI 2", async () => {
  const mongodb_uri =
    "mongodb+srv://admin:password@test.cluster.mongodb.net/test123?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin";
  const expectedDBName = "test123";
  const dbName = utils.getDatabaseNameFromUrl(mongodb_uri);

  expect(dbName).toEqual(expectedDBName);
});

test("Get DB name from Mongo URI 3", async () => {
  const mongodb_uri =
    "mongodb+srv://admin:password@test.cluster.mongodb.net/test123";
  const expectedDBName = "test123";
  const dbName = utils.getDatabaseNameFromUrl(mongodb_uri);

  expect(dbName).toEqual(expectedDBName);
});

test("Get DB name from Mongo URI 4", async () => {
  const mongodb_uri = "mongodb://appsmith:pAssW0rd!@localhost:27017/appsmith";
  const expectedDBName = "appsmith";
  const dbName = utils.getDatabaseNameFromUrl(mongodb_uri);

  expect(dbName).toEqual(expectedDBName);
});
test("Get DB name from Postgres URL", async () => {
  const dbName = utils.getDatabaseNameFromUrl(
    "postgresql://user:password@host:5432/postgres_db",
  );

  expect(dbName).toEqual("postgres_db");
});

test("Get DB name from Postgres URL with query params", async () => {
  const dbName = utils.getDatabaseNameFromUrl(
    "postgresql://user:password@host:5432/postgres_db?sslmode=disable",
  );

  expect(dbName).toEqual("postgres_db");
});
