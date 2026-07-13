import { gateEnabled } from "./gates.js";

describe("gateEnabled — opt-in gate parsing (data/JS layers)", () => {
  // The Admin Settings UI writes "true"/"false"; operators historically used "1"/"0". Regression guard: the old
  // implementation was `=== "1"`, which would silently ignore the "true" the UI now writes.
  it.each(["1", "true", "TRUE", "True", "yes", "on", " true "])(
    "enables for truthy value %j",
    (value) => {
      expect(gateEnabled(value)).toBe(true);
    },
  );

  it.each(["0", "false", "FALSE", "no", "off", "", "  ", "disabled", "2"])(
    "stays off for %j",
    (value) => {
      expect(gateEnabled(value)).toBe(false);
    },
  );

  it("stays off when the variable is unset", () => {
    expect(gateEnabled(undefined)).toBe(false);
  });
});
