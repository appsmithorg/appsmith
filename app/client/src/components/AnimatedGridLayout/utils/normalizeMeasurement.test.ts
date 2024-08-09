import { normalizeMeasurement } from "./normalizeMeasurement";

describe("normalizeMeasurement", () => {
  test.each([
    ["1fr", 1],
    ["1px", 1],
    ["1%", 1],
    [" 1 ", 1],
    [" ", 0],
    [".", 0],
  ])("%s -> %s", (input, output) => {
    expect(normalizeMeasurement(input)).toBe(output);
  });
});
