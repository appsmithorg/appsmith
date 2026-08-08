export enum RateSizes {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
}

export const RATE_SIZES = {
  SMALL: 12,
  MEDIUM: 16,
  LARGE: 21,
};

export type RateSize = keyof typeof RateSizes;

/**
 * Upper bound for the Rating widget's `maxCount` property. The widget used
 * to render one DOM star node per unit of `maxCount`, so a large or
 * binding-driven value (e.g. 1_000_000) would crash the browser with
 * "Aw, snap!". This cap is enforced uniformly across the property pane,
 * the layout-sizing paths, and the render path.
 *
 * See https://github.com/appsmithorg/appsmith/issues/14833 for the original
 * report and the maintainer-acknowledged three-surface requirement.
 */
export const MAX_RATE_COUNT = 100;

/** Fallback used when `maxCount` is missing, non-numeric, or non-positive. */
export const DEFAULT_MAX_RATE_COUNT = 5;

/**
 * Clamp a (possibly user-supplied, binding-driven, or string) `maxCount` to
 * the widget's safe range. Every consumer of `maxCount` (property-pane
 * validation, `getAutoLayoutConfig`, `getAnvilConfig`, and
 * `RateComponent`) must go through this helper to guarantee that a runaway
 * value cannot reach the layout engine or the rendering path.
 */
export const getSafeMaxCount = (rawValue: unknown): number => {
  let parsed: number;

  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    parsed = rawValue;
  } else if (typeof rawValue === "string" && rawValue.trim() !== "") {
    parsed = Number(rawValue);
  } else {
    parsed = DEFAULT_MAX_RATE_COUNT;
  }

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_MAX_RATE_COUNT;
  }

  return Math.min(parsed, MAX_RATE_COUNT);
};
