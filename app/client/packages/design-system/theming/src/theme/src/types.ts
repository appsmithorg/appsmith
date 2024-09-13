import type { ReactNode } from "react";
import type { CSSProperties } from "react";

import type { ColorMode } from "../../color";
import type { Typography, ThemeToken, IconStyle } from "../../token";

export type Theme = ThemeToken & {
  typography?: Typography;
  colorMode?: ColorMode;
  iconStyle?: IconStyle;
};

export interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
  /** Sets the CSS className  for the content popover. Only use as a **last resort**. */
  className?: string;
  /** Sets inline [style](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style) for the element. Only use as a **last resort**. Use style props instead. */
  style?: CSSProperties;
}
