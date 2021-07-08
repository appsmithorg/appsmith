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
