import {
  checkForPostRunAction,
  getPostRunActionName,
} from "../postRunActionsUtil";
import type { PostActionRunConfig } from "api/types";

describe("checkForPostRunAction", () => {
  it("should return true for valid post run action", () => {
    const validAction: PostActionRunConfig = {
      type: "FORM",
      name: "some_name",
    };

    expect(checkForPostRunAction(validAction)).toBe(true);
  });

  it("should return false for undefined input", () => {
    expect(checkForPostRunAction(undefined)).toBe(false);
  });

  it("should return false for input without type property", () => {
    const invalidAction = {
      name: "some_name",
    };

    expect(checkForPostRunAction(invalidAction as PostActionRunConfig)).toBe(
      false,
    );
  });
});

describe("getPostRunActionName", () => {
  it("should return name for valid post run action", () => {
    const validAction: PostActionRunConfig = {
      type: "FORM",
      name: "test_action",
    };

    expect(getPostRunActionName(validAction)).toBe("test_action");
  });

  it("should return empty string for undefined input", () => {
    expect(getPostRunActionName(undefined)).toBe("");
  });

  it("should return empty string for action without name", () => {
    const actionWithoutName: PostActionRunConfig = {
      type: "FORM",
      name: "",
    };

    expect(getPostRunActionName(actionWithoutName)).toBe("");
  });
});
