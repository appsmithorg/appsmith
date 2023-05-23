import type { ColorTypes } from "colorjs.io/types/src/color";
export type { ColorTypes } from "colorjs.io/types/src/color";

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

export type ThemeTokens = {
  [key in TokenType]: { [key: string]: Token };
};

export type Theme = ThemeTokens & {
  rootUnit: number;
  fontFamily?: fontFamilyTypes;
  typography?: Typography;
};

export type TokenType =
  | "sizing"
  | "color"
  | "spacing"
  | "borderRadius"
  | "boxShadow"
  | "borderWidth"
  | "opacity";

export interface Token {
  value: string | number;
  type: TokenType;
}

export interface TokenSource {
  seedColor?: ColorTypes;
  colorMode?: ColorMode;
  rootUnit: number;
  borderRadius?: TokenObj;
  boxShadow?: TokenObj;
  borderWidth?: TokenObj;
  opacity?: TokenObj;
  typography?: Typography;
  fontFamily?: fontFamilyTypes;
}

export type TokenObj = { [key: string]: string | number };

export type ColorMode = "light" | "dark";

export interface ColorModeTheme {
  getColors: () => {
    bg: string;
    bgAccent: string;
    bgAccentHover: string;
    bgAccentActive: string;
    bgAccentSubtleHover: string;
    bgAccentSubtleActive: string;
    fg: string;
    fgNeutral: string;
    fgPositive: string;
    fgWarn: string;
    fgAccent: string;
    fgOnAccent: string;
    bdAccent: string;
    bdFocus: string;
    bdNeutral: string;
    bdNeutralHover: string;
    bdNegative: string;
    bdNegativeHover: string;
    fgOnAssistive: string;
    bgAssistive: string;
  };
}

export interface TypographyTokens {
  capHeight: number;
  lineGap: number;
  fontFamily?: fontFamilyTypes;
}

export type TypographyVariants = "body" | "footnote" | "heading";

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
