import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

import * as utils from "./utils";
import * as enable_form_login from "./enable_form_login";

const REDIS_URL = "rediss://appuser:s3cret@redis.example:6380";
const ORG_ID = "68b6f2a5ad0c4823e24c9212";

describe("enable_form_login", () => {
  const originalRedisUrl = process.env.APPSMITH_REDIS_URL;
  const originalDbUrl = process.env.APPSMITH_DB_URL;

  beforeEach(() => {
    process.env.APPSMITH_REDIS_URL = REDIS_URL;
    process.env.APPSMITH_DB_URL = "mongodb://localhost:27017/appsmith";
    jest.spyOn(utils, "ensureSupervisorIsRunning").mockResolvedValue();
    jest
      .spyOn(utils, "execCommandReturningOutput")
      .mockResolvedValue(
        JSON.stringify({ _id: { $oid: ORG_ID }, slug: "default" }),
      );
    jest.spyOn(utils, "execCommand").mockResolvedValue();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.APPSMITH_REDIS_URL = originalRedisUrl;
    process.env.APPSMITH_DB_URL = originalDbUrl;
    jest.restoreAllMocks();
  });

  test("clears the organization cache without the password in argv", async () => {
    await enable_form_login.run();

    const redisCalls = (utils.execCommand as jest.Mock).mock.calls.filter(
      (call) => (call[0] as string[])[0] === "redis-cli",
    );

    expect(redisCalls).toHaveLength(1);

    const [cmd, options] = redisCalls[0] as [
      string[],
      { env?: Record<string, string> },
    ];

    // Host, port, TLS and user go on the command line; the password goes to
    // redis-cli through REDISCLI_AUTH so it never appears in the process table.
    expect(cmd.slice(1, 7)).toEqual([
      "-h",
      "redis.example",
      "-p",
      "6380",
      "--tls",
      "--user",
    ]);
    expect(cmd).toContain("appuser");
    expect(cmd.join(" ")).not.toContain("s3cret");
    expect(cmd.slice(-2)).toEqual(["DEL", `organization:${ORG_ID}`]);
    expect(options.env.REDISCLI_AUTH).toBe("s3cret");
  });
});
