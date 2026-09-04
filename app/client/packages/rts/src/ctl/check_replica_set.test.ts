import { afterEach, describe, expect, jest, test } from "@jest/globals";
import type { MongoClient } from "mongodb";

import { createClient, exec } from "./check_replica_set";

describe("createClient", () => {
  // The Node driver throws MongoParseError on connection-string options it
  // does not recognise. serverMonitoringMode is only known from driver 6.1.
  test("does not throw MongoParseError for serverMonitoringMode in the URI", async () => {
    let client: MongoClient | undefined;

    expect(() => {
      client = createClient(
        "mongodb://localhost:27017/appsmith?serverMonitoringMode=poll",
      );
    }).not.toThrow();

    await client?.close();
  });
});

describe("exec", () => {
  const originalUrl = process.env.APPSMITH_DB_URL;

  afterEach(() => {
    process.env.APPSMITH_DB_URL = originalUrl;
    jest.restoreAllMocks();
  });

  test("exits 1 with a clear message when APPSMITH_DB_URL is unset", async () => {
    delete process.env.APPSMITH_DB_URL;

    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const exit = jest.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);

    await expect(exec()).rejects.toThrow("process.exit");

    expect(exit).toHaveBeenCalledWith(1);
    expect(consoleError).toHaveBeenCalledWith("APPSMITH_DB_URL is not set");
  });
});
