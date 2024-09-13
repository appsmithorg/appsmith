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

export const APP_MAX_WIDTH = {
  Unlimited: "UNLIMITED",
  Large: "LARGE",
  Medium: "MEDIUM",
} as const;

export type AppMaxWidth = (typeof APP_MAX_WIDTH)[keyof typeof APP_MAX_WIDTH];
