import React from "react";
import {
  createGlobalFontStack,
  createTypographyStringMap,
} from "../../typography";
import { css, injectGlobal } from "@emotion/css";
import { cssRule } from "../../utils/cssRule";
import { ThemeContext } from "./ThemeContext";
import clsx from "clsx";

import type { FontFamily } from "../../typography";
import type { Theme, ThemeProviderProps } from "./types";

const { fontFaces } = createGlobalFontStack();
injectGlobal(fontFaces);

const fontFamilyCss = (fontFamily?: FontFamily) => {
  const fontFamilyCss =
    fontFamily && fontFamily !== "System Default"
      ? `${fontFamily}, sans-serif`
      : "-apple-system, 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Ubuntu'";

  return `font-family: ${fontFamilyCss}; --font-family: ${fontFamilyCss}`;
};

const providerCss = ({
  colorMode,
  fontFamily,
  typography,
  ...theme
}: Theme) => css`
  ${fontFamilyCss(fontFamily)};
  ${createTypographyStringMap(typography, fontFamily)};
  ${cssRule(theme)};
  color-scheme: ${colorMode};
`;

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, className, style, theme } = props;

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className={clsx(className, providerCss(theme))}
        data-theme-provider=""
        style={style}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
