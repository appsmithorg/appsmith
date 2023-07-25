import type { ReactNode } from "react";
import type { RootUnit, ThemeToken } from "../token";

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
