const { describe, test, expect } = require("@jest/globals");
const utils = require("./utils");

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
