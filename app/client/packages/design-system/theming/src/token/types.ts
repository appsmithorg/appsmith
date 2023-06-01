import type { ColorMode, ColorTypes } from "../color";
import type { FontFamilyTypes, Typography } from "../typography";

export type ThemeTokens = {
  [key in TokenType]?: { [key: string]: Token };
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
  fontFamily?: FontFamilyTypes;
}

export type TokenObj = { [key: string]: string | number };
