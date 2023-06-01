import type { ReactNode } from "react";
import type { FlattenSimpleInterpolation } from "styled-components";
import type { ThemeTokens } from "../token";
import type { Typography, TypographyVariants } from "../typography";

export type Theme = ThemeTokens & {
  typography: Typography;
  rootUnit: number;
};

export type ThemeContextType = ThemeTokens & {
  rootUnit: number;
  typography?: {
    [key in TypographyVariants]?: FlattenSimpleInterpolation;
  };
};

export interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
  className?: string;
}
