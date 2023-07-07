import type { ColorMode, ColorTypes } from "../color";
import type { FontFamily, TypographySource } from "../typography";

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

export interface TokenSource {
  rootUnit: number;
  typography: TypographySource;
  seedColor?: ColorTypes;
  colorMode?: ColorMode;
  borderRadius?: TokenObj;
  boxShadow?: TokenObj;
  borderWidth?: TokenObj;
  opacity?: TokenObj;
  fontFamily?: FontFamily;
  zIndex?: TokenObj;
}

export type TokenObj = { [key: string]: string | number };
