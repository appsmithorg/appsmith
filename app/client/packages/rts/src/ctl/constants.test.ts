import { afterEach, describe, expect, test } from "@jest/globals";

describe("APPSMITHCTL_LOG_PATH", () => {
  const originalLogDir = process.env.APPSMITH_LOG_DIR;

  afterEach(() => {
    if (originalLogDir === undefined) {
      delete process.env.APPSMITH_LOG_DIR;
    } else {
      process.env.APPSMITH_LOG_DIR = originalLogDir;
    }
  });

  function loadLogPath(): string {
    let logPath = "";

    jest.isolateModules(() => {
      logPath = require("./constants").APPSMITHCTL_LOG_PATH;
    });

    return logPath;
  }

  test("defaults to the stacks logs folder", () => {
    delete process.env.APPSMITH_LOG_DIR;
    expect(loadLogPath()).toBe("/appsmith-stacks/logs/appsmithctl");
  });

  test("follows APPSMITH_LOG_DIR", () => {
    process.env.APPSMITH_LOG_DIR = "/var/log/appsmith";
    expect(loadLogPath()).toBe("/var/log/appsmith/appsmithctl");
  });
});
