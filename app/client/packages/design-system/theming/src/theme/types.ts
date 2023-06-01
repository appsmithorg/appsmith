import type { ColorMode, ColorTypes } from "../color";
import type { fontFamilyTypes, Typography } from "../typography";

export type Theme = ThemeTokens & {
  rootUnit: number;
  fontFamily?: fontFamilyTypes;
  typography?: Typography;
};

export type ThemeTokens = {
  [key in TokenType]?: { [key: string]: Token };
};

export type Types = ThemeTokens & {
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
