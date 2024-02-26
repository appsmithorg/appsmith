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

import type { ColorMode, ColorTypes } from "../../color";

export type ThemeToken = {
  [key in TokenType]?: { [key: string]: Token };
};

export type TokenType =
  | "sizing"
  | "color"
  | "outerSpacing"
  | "innerSpacing"
  | "borderRadiusElevation"
  | "boxShadow"
  | "borderWidth"
  | "opacity"
  | "zIndex"
  | "strokeWidth"
  | "iconSize";

export interface Token {
  value: string | number;
  type: TokenType;
}

export interface TokenSource {
  typography?: Typography;
  seedColor?: ColorTypes;
  colorMode?: ColorMode;
  borderRadiusElevation?: TokenObj;
  boxShadow?: TokenObj;
  borderWidth?: TokenObj;
  opacity?: TokenObj;
  fontFamily?: FontFamily;
  zIndex?: TokenObj;
  sizing?: TokenObj;
  outerSpacing?: TokenObj;
  innerSpacing?: TokenObj;
  iconStyle?: IconStyle;
  strokeWidth?: TokenObj;
  iconSize?: TokenObj;
}

export interface TokenObj {
  [key: string]: string | number;
}

export interface IconDensity {
  tight: TokenObj;
  regular: TokenObj;
  loose: TokenObj;
}

export interface IconSizing {
  small: TokenObj;
  regular: TokenObj;
  big: TokenObj;
}

export interface TokenScaleConfig {
  V: number;
  R: number;
  N: number;
  stepsUp: number;
  stepsDown: number;
  userSizingRatio?: number;
  userDensityRatio?: number;
}

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
  caption: "caption",
  body: "body",
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
  fontSize: string;
  lineHeight: string;
  before: {
    content: string;
    marginBottom: string;
    display: string;
  };
  after: {
    content: string;
    marginTop: string;
    display: string;
  };
}

export type Typography = {
  [key in keyof typeof TYPOGRAPHY_VARIANTS]: TypographyVariantMetric;
};

export type IconStyle = "outlined" | "filled";
