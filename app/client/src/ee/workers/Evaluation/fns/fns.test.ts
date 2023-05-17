import { getActionTriggerFunctionNames, getPlatformFunctions } from ".";

describe("fns", () => {
  it("getActionTriggerFunctionNames should filter EE functions", () => {
    const result = getActionTriggerFunctionNames(true);
    expect(result["WINDOW_MESSAGE_LISTENER"]).toBeUndefined();
    expect(result["UNLISTEN_WINDOW_MESSAGE"]).toBeUndefined();
  });

  it("getActionTriggerFunctionNames should include EE functions", () => {
    const result = getActionTriggerFunctionNames(false);
    expect(result["WINDOW_MESSAGE_LISTENER"]).toBeDefined();
    expect(result["UNLISTEN_WINDOW_MESSAGE"]).toBeDefined();
  });

  it("getPlatformFunctions should filter EE functions", () => {
    const result = getPlatformFunctions(true);
    expect(
      result.find((d: { name: string }) => d.name === "windowMessageListener"),
    ).toBeUndefined();
    expect(
      result.find((d: { name: string }) => d.name === "unlistenWindowMessage"),
    ).toBeUndefined();
  });

  it("getPlatformFunctions should include EE functions", () => {
    const result = getPlatformFunctions(false);
    expect(
      result.find((d: { name: string }) => d.name === "windowMessageListener"),
    ).toBeDefined();
    expect(
      result.find((d: { name: string }) => d.name === "unlistenWindowMessage"),
    ).toBeDefined();
  });
});
