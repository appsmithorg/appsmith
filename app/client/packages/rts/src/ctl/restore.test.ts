import fsPromises from "fs/promises";
import readlineSync from "readline-sync";
import * as utils from "./utils";
import {
  checkRestoreVersionCompatability,
  decryptArchive,
  ensureEncryptionKeysPresent,
  getBackupFileName,
} from "./restore";

jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  execCommand: jest.fn(),
  execCommandSilent: jest.fn(),
  listLocalBackupFiles: jest.fn(),
  getCurrentAppsmithVersion: jest.fn(),
}));

const mockedUtils = utils as jest.Mocked<typeof utils>;

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.APPSMITH_BACKUP_ARCHIVE_PASSWORD;
  readlineSync.question = jest.fn().mockImplementation(() => {
    throw new Error("readlineSync.question should not be called");
  });
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("getBackupFileName with --backup-file", () => {
  beforeEach(() => {
    mockedUtils.listLocalBackupFiles.mockResolvedValue([
      "appsmith-backup-0001.tar.gz",
      "appsmith-backup-0002.tar.gz.enc",
    ]);
  });

  it("returns the local file named by --backup-file without prompting", async () => {
    const name = await getBackupFileName([
      "--backup-file=appsmith-backup-0002.tar.gz.enc",
    ]);

    expect(name).toBe("appsmith-backup-0002.tar.gz.enc");
    expect(readlineSync.question).not.toHaveBeenCalled();
  });

  it("throws when --backup-file names an unknown archive", async () => {
    await expect(
      getBackupFileName(["--backup-file=no-such-backup.tar.gz"]),
    ).rejects.toThrow("no-such-backup.tar.gz");
  });

  it("throws when --backup-file contains a path instead of a file name", async () => {
    await expect(
      getBackupFileName(["--backup-file=../../etc/passwd"]),
    ).rejects.toThrow("file name");
  });

  it("throws in non-interactive mode when --backup-file is missing", async () => {
    await expect(getBackupFileName(["--non-interactive"])).rejects.toThrow(
      "--backup-file",
    );
  });

  it("still prompts for an index in interactive mode", async () => {
    readlineSync.question = jest.fn().mockReturnValue("0");

    const name = await getBackupFileName([]);

    expect(name).toBe("appsmith-backup-0001.tar.gz");
    expect(readlineSync.question).toHaveBeenCalled();
  });
});

describe("decryptArchive", () => {
  const encPath = "/backup/archive.tar.gz.enc";
  const outPath = "/backup/archive.tar.gz";

  it("uses APPSMITH_BACKUP_ARCHIVE_PASSWORD without prompting", async () => {
    process.env.APPSMITH_BACKUP_ARCHIVE_PASSWORD = "s3cret";
    mockedUtils.execCommandSilent.mockResolvedValue(undefined);

    const ok = await decryptArchive(encPath, outPath, []);

    expect(ok).toBe(true);
    expect(mockedUtils.execCommandSilent).toHaveBeenCalledTimes(1);
    // The password must reach openssl via the child environment, not argv.
    expect(mockedUtils.execCommandSilent.mock.calls[0][0]).not.toContain(
      "s3cret",
    );
    expect(
      mockedUtils.execCommandSilent.mock.calls[0][1].env
        .APPSMITH_BACKUP_ARCHIVE_PASSWORD,
    ).toBe("s3cret");
    expect(readlineSync.question).not.toHaveBeenCalled();
  });

  it("fails after a single attempt when the env password is wrong", async () => {
    process.env.APPSMITH_BACKUP_ARCHIVE_PASSWORD = "wrong";
    mockedUtils.execCommandSilent.mockRejectedValue(new Error("bad decrypt"));

    const ok = await decryptArchive(encPath, outPath, []);

    expect(ok).toBe(false);
    expect(mockedUtils.execCommandSilent).toHaveBeenCalledTimes(1);
    expect(readlineSync.question).not.toHaveBeenCalled();
  });

  it("fails in non-interactive mode when the env password is missing", async () => {
    const ok = await decryptArchive(encPath, outPath, ["--non-interactive"]);

    expect(ok).toBe(false);
    expect(mockedUtils.execCommandSilent).not.toHaveBeenCalled();
    expect(readlineSync.question).not.toHaveBeenCalled();
  });

  it("still prompts in interactive mode when no env password is set", async () => {
    readlineSync.question = jest.fn().mockReturnValue("typed-pass");
    mockedUtils.execCommandSilent.mockResolvedValue(undefined);

    const ok = await decryptArchive(encPath, outPath, []);

    expect(ok).toBe(true);
    expect(readlineSync.question).toHaveBeenCalled();
    expect(mockedUtils.execCommandSilent.mock.calls[0][0]).not.toContain(
      "typed-pass",
    );
    expect(
      mockedUtils.execCommandSilent.mock.calls[0][1].env
        .APPSMITH_BACKUP_ARCHIVE_PASSWORD,
    ).toBe("typed-pass");
  });
});

describe("ensureEncryptionKeysPresent", () => {
  it("passes when both encryption keys are set", () => {
    process.env.APPSMITH_ENCRYPTION_PASSWORD = "pwd";
    process.env.APPSMITH_ENCRYPTION_SALT = "salt";

    expect(() => ensureEncryptionKeysPresent()).not.toThrow();
  });

  it("throws when APPSMITH_ENCRYPTION_PASSWORD is missing", () => {
    delete process.env.APPSMITH_ENCRYPTION_PASSWORD;
    process.env.APPSMITH_ENCRYPTION_SALT = "salt";

    expect(() => ensureEncryptionKeysPresent()).toThrow(
      "APPSMITH_ENCRYPTION_PASSWORD",
    );
  });

  it("throws when APPSMITH_ENCRYPTION_SALT is missing", () => {
    process.env.APPSMITH_ENCRYPTION_PASSWORD = "pwd";
    delete process.env.APPSMITH_ENCRYPTION_SALT;

    expect(() => ensureEncryptionKeysPresent()).toThrow(
      "APPSMITH_ENCRYPTION_SALT",
    );
  });
});

describe("checkRestoreVersionCompatability in non-interactive mode", () => {
  beforeEach(() => {
    jest
      .spyOn(fsPromises, "readFile")
      .mockResolvedValue(JSON.stringify({ appsmithVersion: "v1.0.0" }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws on version mismatch, pointing at --force", async () => {
    mockedUtils.getCurrentAppsmithVersion.mockResolvedValue("v2.0.0");

    await expect(
      checkRestoreVersionCompatability("/contents", ["--non-interactive"]),
    ).rejects.toThrow("--force");
    expect(readlineSync.question).not.toHaveBeenCalled();
  });

  it("proceeds on version mismatch with --force", async () => {
    mockedUtils.getCurrentAppsmithVersion.mockResolvedValue("v2.0.0");

    await expect(
      checkRestoreVersionCompatability("/contents", [
        "--non-interactive",
        "--force",
      ]),
    ).resolves.toBeUndefined();
    expect(readlineSync.question).not.toHaveBeenCalled();
  });

  it("proceeds when versions match", async () => {
    mockedUtils.getCurrentAppsmithVersion.mockResolvedValue("v1.0.0");

    await expect(
      checkRestoreVersionCompatability("/contents", ["--non-interactive"]),
    ).resolves.toBeUndefined();
    expect(readlineSync.question).not.toHaveBeenCalled();
  });
});
