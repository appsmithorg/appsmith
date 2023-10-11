import { getNextTabbableDescendant } from "./tabbable";

describe("getNextTabbableDescendant", () => {
  it("should return undefined if no descendants are passed", () => {
    expect(getNextTabbableDescendant([])).toBeUndefined();
  });
});
