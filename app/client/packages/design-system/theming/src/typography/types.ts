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
import nunitoSans from "@capsizecss/metrics/nunitoSans";
import appleSystem from "@capsizecss/metrics/appleSystem";
import BlinkMacSystemFont from "@capsizecss/metrics/blinkMacSystemFont";

export interface TypographyTokens {
  capHeight: number;
  lineGap: number;
  fontFamily?: fontFamilyTypes;
}

export interface TypographyStyles {
  rootUnit: number;
  typography?: Typography;
  fontFamily?: fontFamilyTypes;
}

export type TypographyVariants = "body" | "footnote" | "heading";

export type TypographyTypes =
  | "default"
  | "neutral"
  | "positive"
  | "negative"
  | "warn";

export type Typography = {
  [key in TypographyVariants]?: TypographyTokens;
};

export const fontMetricsMap = {
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

export type fontFamilyTypes = keyof typeof fontMetricsMap;
