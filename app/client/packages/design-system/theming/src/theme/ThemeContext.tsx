import { createContext, useContext } from "react";
import type { FlattenSimpleInterpolation } from "styled-components";
import type { fontFamilyTypes, TypographyVariants } from "../typography";
import type { ThemeTokens } from "./types";

type Theme = ThemeTokens & {
  rootUnit?: number;
  fontFamily?: fontFamilyTypes;
  typography?: {
    [key in TypographyVariants]?: FlattenSimpleInterpolation;
  };
};

export const ThemeContext = createContext<Theme | null>(null);

export const useThemeContext = () => {
  return useContext(ThemeContext);
};
