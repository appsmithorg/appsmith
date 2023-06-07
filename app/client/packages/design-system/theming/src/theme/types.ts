import type { ReactNode } from "react";
import type { FlattenSimpleInterpolation } from "styled-components";
import type { ThemeToken } from "../token";
import type { Typography, TypographyVariant } from "../typography";

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
