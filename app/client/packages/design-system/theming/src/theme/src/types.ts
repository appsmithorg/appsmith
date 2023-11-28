import type { MutableRefObject } from "react";
import type { CSSProperties } from "react";
import type { ReactNode } from "react";
import type { ColorMode } from "../../color";
import type { FontFamily, Typography } from "../../typography";
import type { ThemeToken } from "../../token";

export type Theme = ThemeToken & {
  typography?: Typography;
  fontFamily?: FontFamily;
  colorMode?: ColorMode;
};

export interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
  /** Sets the CSS className  for the content popover. Only use as a **last resort**. */
  className?: string;
  /** Sets inline [style](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style) for the element. Only use as a **last resort**. Use style props instead. */
  style?: CSSProperties;
  /** Width for calculating fluid tokens */
  width?: number;
}

export interface UseThemeProps {
  seedColor?: string;
  colorMode?: ColorMode;
  borderRadius?: string;
  fontFamily?: FontFamily;
  userDensity?: number;
  userSizing?: number;
  providerRef?: MutableRefObject<HTMLDivElement | null>;
}
