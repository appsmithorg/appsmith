import type { ReactNode } from "react";

import type { ColorMode } from "../color";
import type { FontFamily } from "../typography";
import type { RootUnit, ThemeToken } from "../token";

export type Theme = ThemeToken & {
  typography?: string;
  fontFamily?: string;
  rootUnit?: RootUnit;
};

export type ThemeContextType = ThemeToken & {
  rootUnit?: RootUnit;
};

export interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
  className?: string;
}

export type UseThemeProps = {
  seedColor?: string;
  colorMode?: ColorMode;
  borderRadius?: string;
  fontFamily?: FontFamily;
  rootUnitRatio?: number;
};
