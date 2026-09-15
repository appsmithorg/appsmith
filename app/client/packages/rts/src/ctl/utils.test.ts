import { describe, expect, test } from "@jest/globals";

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

describe("toRedisCliUrl", () => {
  test("keeps a full redis URL with credentials and port", () => {
    expect(utils.toRedisCliUrl("redis://user:secret@redis.example:6380")).toBe(
      "redis://user:secret@redis.example:6380",
    );
  });

  test("keeps a TLS rediss URL", () => {
    expect(utils.toRedisCliUrl("rediss://:secret@redis.example:6379")).toBe(
      "rediss://:secret@redis.example:6379",
    );
  });

  test("maps the redis-cluster scheme to redis for redis-cli", () => {
    expect(
      utils.toRedisCliUrl("redis-cluster://:secret@cluster.example:6379"),
    ).toBe("redis://:secret@cluster.example:6379");
  });

  test("wraps a bare host or host:port in a redis URL", () => {
    expect(utils.toRedisCliUrl("redis.example")).toBe("redis://redis.example");
    expect(utils.toRedisCliUrl("redis.example:6380")).toBe(
      "redis://redis.example:6380",
    );
  });

  test("returns null for empty or unset values", () => {
    expect(utils.toRedisCliUrl("")).toBeNull();
    expect(utils.toRedisCliUrl("   ")).toBeNull();
    expect(utils.toRedisCliUrl("undefined")).toBeNull();
    expect(utils.toRedisCliUrl(undefined)).toBeNull();
  });
});
