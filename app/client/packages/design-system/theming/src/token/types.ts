import type { ColorMode, ColorTypes } from "../color";
import type { FontFamily, Typography } from "../typography";

export type ThemeToken = {
  [key in TokenType]?: { [key: string]: Token };
};

export type TokenType =
  | "sizing"
  | "color"
  | "spacing"
  | "borderRadius"
  | "boxShadow"
  | "borderWidth"
  | "opacity"
  | "zIndex";

export interface Token {
  value: string | number;
  type: TokenType;
}

export type RootUnit = number | string;

export interface TokenSource {
  rootUnit?: RootUnit;
  typography?: Typography;
  seedColor?: ColorTypes;
  colorMode?: ColorMode;
  borderRadius?: TokenObj;
  boxShadow?: TokenObj;
  borderWidth?: TokenObj;
  opacity?: TokenObj;
  fontFamily?: FontFamily;
  zIndex?: TokenObj;
  sizing?: TokenObj;
  spacing?: TokenObj;
}

export type TokenObj = { [key: string]: string | number };
