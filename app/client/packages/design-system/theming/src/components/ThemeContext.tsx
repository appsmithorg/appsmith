import { createContext, useContext } from "react";

export const ThemeContext = createContext<any>(null);

export const useThemeContext = () => {
  return useContext(ThemeContext);
};
