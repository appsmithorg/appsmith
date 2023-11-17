import type { CSSProperties } from "react";
import type { ReactNode } from "react";

import type { ColorMode } from "../../color";
import type { FontFamily, Typography } from "../../typography";
import type { ThemeToken } from "../../token";

export type Theme = ThemeToken & {
  typography?: Typography;
  fontFamily?: FontFamily;
  colorMode?: ColorMode;
};

export interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface UseThemeProps {
  seedColor?: string;
  colorMode?: ColorMode;
  borderRadius?: string;
  fontFamily?: FontFamily;
  userDensity?: number;
  userSizing?: number;
}
