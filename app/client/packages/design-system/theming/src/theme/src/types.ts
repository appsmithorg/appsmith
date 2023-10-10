import type { CSSProperties } from "react";
import type { ReactNode } from "react";

import type { ColorMode } from "../../color";
import type { FontFamily, Typography } from "../../typography";
import type { RootUnit, ThemeToken } from "../../token";

export type Theme = ThemeToken & {
  typography?: Typography;
  fontFamily?: FontFamily;
  rootUnit?: RootUnit;
};

export interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export type UseThemeProps = {
  seedColor?: string;
  colorMode?: ColorMode;
  borderRadius?: string;
  fontFamily?: FontFamily;
  rootUnitRatio?: number;
};

export const SHEET_TYPES = {
  fontFace: "fontFace",
  borderRadius: "borderRadius",
  borderWidth: "borderWidth",
  boxShadow: "boxShadow",
  color: "color",
  opacity: "opacity",
  sizing: "sizing",
  spacing: "spacing",
  zIndex: "zIndex",
  fontFamily: "fontFamily",
  rootUnit: "rootUnit",
  typography: "typography",
} as const;
