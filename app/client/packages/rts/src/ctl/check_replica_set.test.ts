import { describe, expect, test } from "@jest/globals";
import type { MongoClient } from "mongodb";

import { createClient } from "./check_replica_set";

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
