import fs from "fs/promises";
import path from "path";
import { spawnSync } from "child_process";
import { EnvFileLink } from "./backup/links/EnvFileLink";
import { BackupState } from "./backup/BackupState";
import * as restore from "./restore";
import * as utils from "./utils";

// Run the production Python boundary, with only its installed location changed.
jest.mock("child_process", () => {
  const actual = jest.requireActual("child_process");

  return {
    ...actual,
    execFile: (file, args, ...rest) =>
      actual.execFile(
        file,
        args.map((arg) =>
          arg === "/opt/appsmith/env-file.py"
            ? jest
                .requireActual("path")
                .resolve(
                  __dirname,
                  "../../../../../../deploy/docker/fs/opt/appsmith/env-file.py",
                )
            : arg,
        ),
        ...rest,
      ),
  };
});
jest.mock("./utils", () => ({
  execCommand: jest.fn(),
  ensureSupervisorIsRunning: jest.fn(),
  listLocalBackupFiles: jest.fn().mockResolvedValue(["backup.tar.gz"]),
  getCurrentAppsmithVersion: jest.fn().mockResolvedValue("test"),
  getDburl: jest.fn().mockReturnValue("mongodb://localhost/appsmith"),
  getDatabaseNameFromMongoURI: jest.fn().mockReturnValue("appsmith"),
  stop: jest.fn(),
  start: jest.fn(),
}));
jest.mock("readline-sync", () => ({
  question: jest.fn().mockReturnValue("0"),
}));

const parser = path.resolve(
  __dirname,
  "../../../../../../deploy/docker/fs/opt/appsmith/env-file.py",
);
const originalEnv = process.env;
let content: string;
let written: string;

beforeEach(() => {
  jest.clearAllMocks();
  content = "APPSMITH_INSTANCE_NAME=Appsmith\n";
  written = "";
  process.env = {
    ...originalEnv,
    APPSMITH_ENCRYPTION_PASSWORD: "a'b\\c $(secret)",
    APPSMITH_ENCRYPTION_SALT: "salt",
    APPSMITH_MONGODB_USER: "appsmith",
    APPSMITH_MONGODB_PASSWORD: "p'ass",
    APPSMITH_REDIS_URL: "redis://:p'ass@localhost",
    APPSMITH_REDIS_PASSWORD: "p'ass",
  };
  jest
    .spyOn(fs, "readFile")
    .mockImplementation(async (file) =>
      String(file).endsWith("manifest.json")
        ? JSON.stringify({ appsmithVersion: "test", dbName: "appsmith" })
        : content,
    );
  jest.spyOn(fs, "writeFile").mockImplementation(async (_file, data) => {
    written = String(data);
  });
  jest.spyOn(fs, "rename").mockResolvedValue(undefined);
  jest.spyOn(fs, "unlink").mockResolvedValue(undefined);
  jest.spyOn(fs, "mkdtemp").mockResolvedValue("/test-restore");
  jest.spyOn(fs, "readdir").mockResolvedValue([]);
  jest.spyOn(fs, "access").mockResolvedValue(undefined);
  jest.spyOn(fs, "rm").mockResolvedValue(undefined);
  jest.spyOn(process, "exit").mockImplementation(() => undefined as never);
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  process.env = originalEnv;
  process.exitCode = 0;
});

function expectLiteralPassword() {
  // Feeding the written file as the content of a merge invokes the real reader.
  const result = spawnSync("/usr/bin/python3", [parser, "merge", "-"], {
    input: JSON.stringify({ content: written, values: {} }),
    encoding: "utf8",
  });

  expect(result.status).toBe(0);
  expect(result.stdout).toContain("APPSMITH_ENCRYPTION_PASSWORD=");
  const shell = spawnSync(
    "bash",
    ["-c", result.stdout + '\nprintf "%s" "$APPSMITH_ENCRYPTION_PASSWORD"'],
    { encoding: "utf8" },
  );

  expect(shell.status).toBe(0);
  expect(shell.stdout).toBe(process.env.APPSMITH_ENCRYPTION_PASSWORD);
}

test("GHSA-h6hh encrypted backup round-trips literal secrets", async () => {
  const state = new BackupState([]);

  state.isEncryptionEnabled = true;
  state.backupRootPath = "/backup";
  await new EnvFileLink(state).doBackup();
  expectLiteralPassword();
});

test("GHSA-h6hh restore round-trips literal secrets", async () => {
  await restore.run();
  expect(utils.execCommand).toHaveBeenCalledWith(
    expect.arrayContaining(["mongorestore"]),
  );
  expectLiteralPassword();
  expect(fs.rename).toHaveBeenCalled();
  expect(fs.writeFile).toHaveBeenCalledWith(
    expect.any(String),
    expect.any(String),
    expect.objectContaining({ mode: 0o600, flag: "wx" }),
  );
});

test.each(["APPSMITH_NAME=${SECRET}", "PATH=bad", "APPSMITH_NAME='unfinished"])(
  "restore refuses incompatible config before stopping services: %s",
  async (legacy) => {
    content = legacy;
    await restore.run();
    expect(process.exitCode).toBe(1);
    expect(utils.stop).not.toHaveBeenCalled();
    expect(utils.execCommand).not.toHaveBeenCalledWith(
      expect.arrayContaining(["mongorestore"]),
    );
    expect(fs.writeFile).not.toHaveBeenCalled();
  },
);

test("restore refuses multiline secrets before changing the database", async () => {
  process.env.APPSMITH_ENCRYPTION_PASSWORD = "private\nvalue";
  await restore.run();
  expect(process.exitCode).toBe(1);
  expect(utils.stop).not.toHaveBeenCalled();
  expect(fs.writeFile).not.toHaveBeenCalled();
  expect(JSON.stringify((console.error as jest.Mock).mock.calls)).not.toContain(
    "private",
  );
});
