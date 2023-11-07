import arial from "@capsizecss/metrics/arial";
import inter from "@capsizecss/metrics/inter";
import rubik from "@capsizecss/metrics/rubik";
import roboto from "@capsizecss/metrics/roboto";
import ubuntu from "@capsizecss/metrics/ubuntu";
import poppins from "@capsizecss/metrics/poppins";
import segoeUI from "@capsizecss/metrics/segoeUI";
import openSans from "@capsizecss/metrics/openSans";
import notoSans from "@capsizecss/metrics/notoSans";
import montserrat from "@capsizecss/metrics/montserrat";
import nunitoSans from "@capsizecss/metrics/nunitoSans12pt";
import appleSystem from "@capsizecss/metrics/appleSystem";
import BlinkMacSystemFont from "@capsizecss/metrics/blinkMacSystemFont";

export const FONT_METRICS = {
  Poppins: poppins,
  Inter: inter,
  Roboto: roboto,
  Rubik: rubik,
  Ubuntu: ubuntu,
  "Noto Sans": notoSans,
  "Open Sans": openSans,
  Montserrat: montserrat,
  "Nunito Sans": nunitoSans,
  Arial: arial,
  "-apple-system": appleSystem,
  BlinkMacSystemFont: BlinkMacSystemFont,
  "Segoe UI": segoeUI,
} as const;

// we use "as const" here because we need to iterate by variants
export const TYPOGRAPHY_VARIANTS = {
  footnote: "footnote",
  body: "body",
  caption: "caption",
  subtitle: "subtitle",
  title: "title",
  heading: "heading",
} as const;

export const TYPOGRAPHY_FONT_WEIGHTS = {
  100: 100,
  200: 200,
  300: 300,
  400: 400,
  500: 500,
  600: 600,
  700: 700,
  800: 800,
  900: 900,
} as const;

export type FontFamily = keyof typeof FONT_METRICS | "System Default";

export interface TypographyVariantMetric {
  capHeight: number;
  lineGap: number;
  fontFamily?: FontFamily;
}

export type Typography = {
  [key in keyof typeof TYPOGRAPHY_VARIANTS]: TypographyVariantMetric;
};
