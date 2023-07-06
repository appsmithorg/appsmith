import type { ReactNode } from "react";
import type { ThemeToken } from "../token";
import type { Typography, TypographyVariant } from "../typography";

export type Theme = ThemeToken & {
  typography: Typography;
  rootUnit: number;
};

export type ThemeContextType = ThemeToken & {
  rootUnit: number;
  typography?: {
    [key in TypographyVariant]?: any;
  };
};

export interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
  className?: string;
}
