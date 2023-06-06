import type { fontMetrics } from "./typography";

export type TypographyVariants = "body" | "footnote" | "heading";

export type TypographyTypes =
  | "default"
  | "neutral"
  | "positive"
  | "negative"
  | "warn";

export type FontFamilyTypes = keyof typeof fontMetrics;

export type TypographyVariantSource = {
  capHeightRatio: number;
  lineGapRatio: number;
  fontFamily?: FontFamilyTypes;
};

export type TypographySource = {
  [key in TypographyVariants]: TypographyVariantSource;
};

export type TypographyVariant = {
  capHeight: number;
  lineGap: number;
  fontFamily?: FontFamilyTypes;
};

export type Typography = {
  [key in TypographyVariants]: TypographyVariant;
};
