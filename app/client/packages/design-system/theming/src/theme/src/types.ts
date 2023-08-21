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

export type ThemeContextType = ThemeToken & {
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
