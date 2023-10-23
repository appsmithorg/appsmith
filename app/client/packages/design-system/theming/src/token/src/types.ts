import type { ColorMode, ColorTypes } from "../../color";
import type { FontFamily, Typography } from "../../typography";

export type ThemeToken = {
  [key in TokenType]?: { [key: string]: Token };
};

export type TokenType =
  | "sizing"
  | "color"
  | "outerSpacing"
  | "innerSpacing"
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
  outerSpacing?: TokenObj;
  innerSpacing?: TokenObj;
}

export interface TokenObj {
  [key: string]: string | number;
}
