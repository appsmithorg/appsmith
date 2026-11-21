import fs from "node:fs";
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

// Other ctl tests replace fs/promises functions and never restore them, and the
// rts tests share one process, so read and clean up with the sync node:fs API.
describe("backup logger", () => {
  const originalLogDir = process.env.APPSMITH_LOG_DIR;
  let logDir: string;

  beforeEach(() => {
    logDir = fs.mkdtempSync(path.join(os.tmpdir(), "appsmithctl-"));
    // index.ts copies docker.env into process.env after the logger is imported.
    process.env.APPSMITH_LOG_DIR = logDir;
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();

    if (originalLogDir === undefined) {
      delete process.env.APPSMITH_LOG_DIR;
    } else {
      process.env.APPSMITH_LOG_DIR = originalLogDir;
    }

    fs.rmSync(logDir, { recursive: true, force: true });
  });

  test("backup_info writes backup.log under APPSMITH_LOG_DIR", async () => {
    await logger.backup_info("test message");

    const log = fs.readFileSync(
      path.join(logDir, "appsmithctl", "backup.log"),
      "utf8",
    );

    expect(log).toContain(" [ INFO ] test message\n");
  });

  test("backup_error appends to the same backup.log", async () => {
    await logger.backup_info("first");
    await logger.backup_error("second");

    const log = fs.readFileSync(
      path.join(logDir, "appsmithctl", "backup.log"),
      "utf8",
    );

    expect(log).toMatch(/ \[ INFO \] first\n.* \[ ERROR \] second\n$/);
  });
});
