import {
  DEFAULT_MAX_RATE_COUNT,
  MAX_RATE_COUNT,
  getSafeMaxCount,
} from "./constants";

/**
 * The Rating widget used to crash the browser with "Aw, snap!" when
 * `maxCount` was set to a very large number (e.g. via a data binding
 * returning 1_000_000). The fix caps the value in the property pane,
 * the auto-layout sizing path, the anvil sizing path, and the render
 * path. These tests pin down the cap so that a future regression on
 * any of the three surfaces cannot pass CI silently.
 *
 * See https://github.com/appsmithorg/appsmith/issues/14833.
 */
describe("getSafeMaxCount", () => {
  it("returns the value unchanged when it is a finite positive integer inside the safe range", () => {
    expect(getSafeMaxCount(1)).toBe(1);
    expect(getSafeMaxCount(5)).toBe(5);
    expect(getSafeMaxCount(42)).toBe(42);
    expect(getSafeMaxCount(MAX_RATE_COUNT)).toBe(MAX_RATE_COUNT);
  });

  it("caps values that exceed MAX_RATE_COUNT", () => {
    expect(getSafeMaxCount(MAX_RATE_COUNT + 1)).toBe(MAX_RATE_COUNT);
    expect(getSafeMaxCount(1_000_000)).toBe(MAX_RATE_COUNT);
    expect(getSafeMaxCount(Number.MAX_SAFE_INTEGER)).toBe(MAX_RATE_COUNT);
  });

  it("falls back to DEFAULT_MAX_RATE_COUNT for non-positive, NaN, or non-numeric values", () => {
    expect(getSafeMaxCount(0)).toBe(DEFAULT_MAX_RATE_COUNT);
    expect(getSafeMaxCount(-1)).toBe(DEFAULT_MAX_RATE_COUNT);
    expect(getSafeMaxCount(Number.NaN)).toBe(DEFAULT_MAX_RATE_COUNT);
    expect(getSafeMaxCount(Number.POSITIVE_INFINITY)).toBe(
      DEFAULT_MAX_RATE_COUNT,
    );
    expect(getSafeMaxCount(undefined)).toBe(DEFAULT_MAX_RATE_COUNT);
    expect(getSafeMaxCount(null)).toBe(DEFAULT_MAX_RATE_COUNT);
    expect(getSafeMaxCount("not-a-number")).toBe(DEFAULT_MAX_RATE_COUNT);
    expect(getSafeMaxCount("")).toBe(DEFAULT_MAX_RATE_COUNT);
    expect(getSafeMaxCount({})).toBe(DEFAULT_MAX_RATE_COUNT);
    expect(getSafeMaxCount([])).toBe(DEFAULT_MAX_RATE_COUNT);
  });

  it("parses numeric strings and clamps the result", () => {
    expect(getSafeMaxCount("5")).toBe(5);
    expect(getSafeMaxCount(" 42 ")).toBe(42);
    expect(getSafeMaxCount("1000000")).toBe(MAX_RATE_COUNT);
  });

  it("uses DEFAULT_MAX_RATE_COUNT for fractional numbers below 1", () => {
    // parseInt("0.5", 10) === 0, which is not a valid maxCount.
    expect(getSafeMaxCount(0.5)).toBe(DEFAULT_MAX_RATE_COUNT);
    // parseInt("0", 10) === 0
    expect(getSafeMaxCount("0")).toBe(DEFAULT_MAX_RATE_COUNT);
  });
});
