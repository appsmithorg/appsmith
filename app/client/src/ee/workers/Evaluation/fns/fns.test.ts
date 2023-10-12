import * as planHelpers from "@appsmith/utils/planHelpers";
import { getActionTriggerFunctionNames, getPlatformFunctions } from ".";

describe("fns", () => {
  it("getActionTriggerFunctionNames not include EE functions", () => {
    jest
      .spyOn(planHelpers, "isWindowMessageListenerEnabled")
      .mockImplementation(() => false);
    const result = getActionTriggerFunctionNames();
    expect(result["WINDOW_MESSAGE_LISTENER"]).toBeUndefined();
    expect(result["UNLISTEN_WINDOW_MESSAGE"]).toBeUndefined();
  });

  it("getActionTriggerFunctionNames should include EE functions", () => {
    jest
      .spyOn(planHelpers, "isWindowMessageListenerEnabled")
      .mockImplementation(() => true);

    const result = getActionTriggerFunctionNames();
    expect(result["WINDOW_MESSAGE_LISTENER"]).toBeDefined();
    expect(result["UNLISTEN_WINDOW_MESSAGE"]).toBeDefined();
  });

  it("getPlatformFunctions should filter EE functions", () => {
    jest
      .spyOn(planHelpers, "isWindowMessageListenerEnabled")
      .mockImplementation(() => false);
    const result = getPlatformFunctions();
    expect(
      result.find((d: { name: string }) => d.name === "windowMessageListener"),
    ).toBeUndefined();
    expect(
      result.find((d: { name: string }) => d.name === "unlistenWindowMessage"),
    ).toBeUndefined();
  });

  it("getPlatformFunctions should include EE functions", () => {
    jest
      .spyOn(planHelpers, "isWindowMessageListenerEnabled")
      .mockImplementation(() => true);
    const result = getPlatformFunctions();

    expect(
      result.find((d: { name: string }) => d.name === "windowMessageListener"),
    ).toBeDefined();
    expect(
      result.find((d: { name: string }) => d.name === "unlistenWindowMessage"),
    ).toBeDefined();
  });
});
