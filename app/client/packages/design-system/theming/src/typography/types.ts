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

export type TypographySource =
  | { body: TypographyVariantSource }
  | { footnote: TypographyVariantSource }
  | { heading: TypographyVariantSource };

export type TypographyVariant = {
  capHeight: number;
  lineGap: number;
  fontFamily?: FontFamilyTypes;
};

export type Typography =
  | { body: TypographyVariant }
  | { footnote: TypographyVariant }
  | { heading: TypographyVariant };
