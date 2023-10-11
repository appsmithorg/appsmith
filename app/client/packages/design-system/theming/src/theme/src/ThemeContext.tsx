import { createContext, useContext } from "react";
import type { Theme } from "./types";

export const ThemeContext = createContext<Theme>({} as Theme);

export const useThemeContext = () => {
  return useContext(ThemeContext);
};
