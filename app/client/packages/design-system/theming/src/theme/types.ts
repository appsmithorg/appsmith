import type { ReactNode } from "react";
import type { FlattenSimpleInterpolation } from "styled-components";
import type { ThemeToken } from "../token";
import type { FontFamily, Typography, TypographyVariant } from "../typography";
import type { ColorMode } from "../color";

export type Theme = ThemeToken & {
  typography: Typography;
  rootUnit: number;
};

export type ThemeContextType = ThemeToken & {
  rootUnit: number;
  typography?: {
    [key in TypographyVariant]?: FlattenSimpleInterpolation;
  };
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
