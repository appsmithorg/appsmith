import type { ColorTypes } from "colorjs.io/types/src/color";
export type { ColorTypes } from "colorjs.io/types/src/color";

export type ThemeTokens = {
  [key in TokenType]: { [key: string]: Token };
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
  rootUnit?: number;
  borderRadius?: TokenObj;
  boxShadow?: TokenObj;
  borderWidth?: TokenObj;
  opacity?: TokenObj;
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
    fgAccent: string;
    fgOnAccent: string;
    bdAccent: string;
    bdFocus: string;
    bdNeutral: string;
    bdNeutralHover: string;
    bdNegative: string;
    bdNegativeHover: string;
  };
}
