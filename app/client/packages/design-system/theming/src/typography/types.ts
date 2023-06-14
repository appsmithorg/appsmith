import type { fontMetrics } from "./typography";

export type TypographyVariant = "body" | "footnote" | "heading";

export type TypographyType =
  | "default"
  | "neutral"
  | "positive"
  | "negative"
  | "warn";

export type FontFamily = keyof typeof fontMetrics;

export type TypographyVariantSourceMetric = {
  capHeightRatio: number;
  lineGapRatio: number;
  fontFamily?: FontFamily;
};

export type TypographySource = {
  [key in TypographyVariant]: TypographyVariantSourceMetric;
};

export type TypographyVariantMetric = {
  capHeight: number;
  lineGap: number;
  fontFamily?: FontFamily;
};

export type Typography = {
  [key in TypographyVariant]: TypographyVariantMetric;
};
