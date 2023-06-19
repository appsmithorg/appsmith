import type { fontMetrics } from "./typography";

// we use as const here because we need to iterate by values
// in order to create objects with values for different variants of typography
export const TypographyVariant = {
  footnote: "footnote",
  body: "body",
  caption: "caption",
  subtitle: "subtitle",
  title: "title",
  heading: "heading",
} as const;

export type TypographyType =
  | "default"
  | "neutral"
  | "positive"
  | "negative"
  | "warn";

export type FontFamily = keyof typeof fontMetrics;

export type TypographyVariantMetric = {
  capHeight: number;
  lineGap: number;
  fontFamily?: FontFamily;
};

export type Typography = {
  [key in keyof typeof TypographyVariant]: TypographyVariantMetric;
};
