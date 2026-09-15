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

  test("clears the organization cache with the full Redis URL", async () => {
    await enable_form_login.run();

    const redisCalls = (utils.execCommand as jest.Mock).mock.calls
      .map((call) => call[0] as string[])
      .filter((cmd) => cmd[0] === "redis-cli");

    expect(redisCalls).toHaveLength(1);

    const cmd = redisCalls[0];

    // Credentials, port and TLS scheme must reach redis-cli, so the URL is
    // passed whole instead of being reduced to a hostname.
    expect(cmd).toContain("-u");
    expect(cmd[cmd.indexOf("-u") + 1]).toBe(REDIS_URL);
    expect(cmd).not.toContain("-h");
    expect(cmd).not.toContain("-p");
    expect(cmd.slice(-2)).toEqual(["DEL", `organization:${ORG_ID}`]);
  });
});
