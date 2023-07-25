import { createContext, useContext } from "react";
import type { ThemeContextType } from "./types";

export const ThemeContext = createContext<ThemeContextType>(
  {} as ThemeContextType,
);

export const useThemeContext = () => {
  return useContext(ThemeContext);
};
