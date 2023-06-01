import type { fontMetrics } from "./typography";

export type TypographyVariants = "body" | "footnote" | "heading";

export type TypographyTypes =
  | "default"
  | "neutral"
  | "positive"
  | "negative"
  | "warn";

export type FontFamilyTypes = keyof typeof fontMetrics;

export type TypographyVariantStyles = {
  capHeight: number;
  lineGap: number;
  fontFamily?: FontFamilyTypes;
};

export type Typography =
  | { body: TypographyVariantStyles }
  | { footnote: TypographyVariantStyles }
  | { heading: TypographyVariantStyles };
