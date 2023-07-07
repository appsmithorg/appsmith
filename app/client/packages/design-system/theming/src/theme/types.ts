import type { ReactNode } from "react";
import type { RootUnit, ThemeToken } from "../token";
import type { FontFamily } from "../typography";
import type { ColorMode } from "../color";

export type Theme = ThemeToken & {
  typography?: string;
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
  rootUnit?: number;
};
