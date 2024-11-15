const { describe, test, expect } = require("@jest/globals");
const utils = require("./utils");

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
    await expect(utils.execCommandSilent(["nonexistentcommand"]))
      .rejects.toThrow();
  });

});
