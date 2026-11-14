import { afterEach, describe, expect, test } from "@jest/globals";
import { getAppsmithctlLogPath } from "./constants";

describe("getAppsmithctlLogPath", () => {
  const originalLogDir = process.env.APPSMITH_LOG_DIR;

  afterEach(() => {
    if (originalLogDir === undefined) {
      delete process.env.APPSMITH_LOG_DIR;
    } else {
      process.env.APPSMITH_LOG_DIR = originalLogDir;
    }
  });

  test("defaults to the stacks logs folder", () => {
    delete process.env.APPSMITH_LOG_DIR;
    expect(getAppsmithctlLogPath()).toBe("/appsmith-stacks/logs/appsmithctl");
  });

  test("follows APPSMITH_LOG_DIR", () => {
    process.env.APPSMITH_LOG_DIR = "/var/log/appsmith";
    expect(getAppsmithctlLogPath()).toBe("/var/log/appsmith/appsmithctl");
  });

  test("follows APPSMITH_LOG_DIR set after the module loads", () => {
    // index.ts copies docker.env into process.env after its imports run.
    process.env.APPSMITH_LOG_DIR = "/from/docker-env";
    expect(getAppsmithctlLogPath()).toBe("/from/docker-env/appsmithctl");
  });
});
