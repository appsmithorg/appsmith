import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import fs from "node:fs";

import * as utils from "./utils";

describe("execCommandReturningOutput", () => {
  test("Output of echo", async () => {
    const result = await utils.execCommandReturningOutput([
      "echo",
      "hello",
      "world",
    ]);

    expect(result).toBe("hello world");
  });

  test("Node console out", async () => {
    const result = await utils.execCommandReturningOutput([
      "node",
      "--eval",
      "console.log('to out')",
    ]);

    expect(result).toBe("to out");
  });

  test("Node console err", async () => {
    const result = await utils.execCommandReturningOutput([
      "node",
      "--eval",
      "console.error('to err')",
    ]);

    expect(result).toBe("to err");
  });

  test("Node console out and err", async () => {
    const result = await utils.execCommandReturningOutput([
      "node",
      "--eval",
      "console.log('to out'); console.error('to err')",
    ]);

    expect(result).toBe("to out\nto err");
  });

  test("Node console err and out", async () => {
    const result = await utils.execCommandReturningOutput([
      "node",
      "--eval",
      "console.error('to err'); console.log('to out')",
    ]);

    expect(result).toBe("to out\nto err");
  });
});

describe("execCommandSilent", () => {
  test("Runs a command", async () => {
    await utils.execCommandSilent(["echo"]);
  });

  test("silences stdout and stderr", async () => {
    const consoleSpy = jest.spyOn(console, "log");

    await utils.execCommandSilent(["node", "--eval", "console.log('test')"]);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test("handles errors silently", async () => {
    await expect(
      utils.execCommandSilent(["nonexistentcommand"]),
    ).rejects.toThrow();
  });
});

describe("toRedisCliConnection", () => {
  test("splits a full redis URL into redis-cli flags and a password", () => {
    expect(
      utils.toRedisCliConnection("redis://appuser:s3cret@redis.example:6380"),
    ).toEqual({
      args: ["-h", "redis.example", "-p", "6380", "--user", "appuser"],
      password: "s3cret",
    });
  });

  test("adds --tls for a rediss URL and decodes the password", () => {
    expect(
      utils.toRedisCliConnection("rediss://:p%40ss%3Dword@redis.example"),
    ).toEqual({
      args: ["-h", "redis.example", "-p", "6379", "--tls"],
      password: "p@ss=word",
    });
  });

  test("treats the redis-cluster scheme like redis", () => {
    expect(
      utils.toRedisCliConnection(
        "redis-cluster://:secret@cluster.example:6379",
      ),
    ).toEqual({
      args: ["-h", "cluster.example", "-p", "6379"],
      password: "secret",
    });
  });

  test("accepts a bare host or host:port without a password", () => {
    expect(utils.toRedisCliConnection("redis.example")).toEqual({
      args: ["-h", "redis.example", "-p", "6379"],
      password: null,
    });
    expect(utils.toRedisCliConnection("redis.example:6380")).toEqual({
      args: ["-h", "redis.example", "-p", "6380"],
      password: null,
    });
  });

  test("returns null for empty or unset values", () => {
    expect(utils.toRedisCliConnection("")).toBeNull();
    expect(utils.toRedisCliConnection("   ")).toBeNull();
    expect(utils.toRedisCliConnection("undefined")).toBeNull();
    expect(utils.toRedisCliConnection(undefined)).toBeNull();
  });
});

describe("env file readers", () => {
  const originalRedisUrl = process.env.APPSMITH_REDIS_URL;
  const originalDbUrl = process.env.APPSMITH_DB_URL;
  const originalMongoUri = process.env.APPSMITH_MONGO_DB_URI;

  beforeEach(() => {
    delete process.env.APPSMITH_REDIS_URL;
    delete process.env.APPSMITH_DB_URL;
    delete process.env.APPSMITH_MONGO_DB_URI;
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue(
        [
          "APPSMITH_DB_URL=mongodb://user:a%3Db@mongo.example:27017/appsmith?authSource=admin&tls=true",
          "APPSMITH_REDIS_URL=redis://:secret==@redis.example:6379",
        ].join("\n"),
      );
  });

  afterEach(() => {
    process.env.APPSMITH_REDIS_URL = originalRedisUrl;
    process.env.APPSMITH_DB_URL = originalDbUrl;
    process.env.APPSMITH_MONGO_DB_URI = originalMongoUri;
    jest.restoreAllMocks();
  });

  test("readRedisUrlSetting keeps '=' characters in the value", () => {
    expect(utils.readRedisUrlSetting()).toBe(
      "redis://:secret==@redis.example:6379",
    );
  });
});
