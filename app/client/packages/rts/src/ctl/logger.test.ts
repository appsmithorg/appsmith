import fsPromises from "fs/promises";
import os from "os";
import path from "path";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import * as logger from "./logger";

describe("backup logger", () => {
  const originalLogDir = process.env.APPSMITH_LOG_DIR;
  let logDir: string;

  beforeEach(async () => {
    logDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), "appsmithctl-"));
    // index.ts copies docker.env into process.env after the logger is imported.
    process.env.APPSMITH_LOG_DIR = logDir;
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    if (originalLogDir === undefined) {
      delete process.env.APPSMITH_LOG_DIR;
    } else {
      process.env.APPSMITH_LOG_DIR = originalLogDir;
    }
    await fsPromises.rm(logDir, { recursive: true, force: true });
  });

  test("backup_info writes backup.log under APPSMITH_LOG_DIR", async () => {
    await logger.backup_info("test message");

    const log = await fsPromises.readFile(
      path.join(logDir, "appsmithctl", "backup.log"),
      "utf8",
    );
    expect(log).toContain(" [ INFO ] test message\n");
  });

  test("backup_error appends to the same backup.log", async () => {
    await logger.backup_info("first");
    await logger.backup_error("second");

    const log = await fsPromises.readFile(
      path.join(logDir, "appsmithctl", "backup.log"),
      "utf8",
    );
    expect(log).toMatch(/ \[ INFO \] first\n.* \[ ERROR \] second\n$/);
  });
});
