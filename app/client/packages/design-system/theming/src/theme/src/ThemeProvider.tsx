import React, { forwardRef, useCallback } from "react";
import {
  createGlobalFontStack,
  createTypographyStringMap,
} from "../../typography";
import { css, injectGlobal } from "@emotion/css";
import { cssRule } from "../../utils/cssRule";
import { ThemeContext } from "./ThemeContext";
import clsx from "clsx";

import type { Ref } from "react";
import type { FontFamily } from "../../typography";
import type { ThemeProviderProps } from "./types";

const { fontFaces } = createGlobalFontStack();
injectGlobal(fontFaces);

const fontFamilyCss = (fontFamily?: FontFamily) => {
  const fontFamilyCss =
    fontFamily && fontFamily !== "System Default"
      ? `${fontFamily}, sans-serif`
      : "-apple-system, 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Ubuntu'";

  return `font-family: ${fontFamilyCss}; --font-family: ${fontFamilyCss}`;
};

const _ThemeProvider = (
  props: ThemeProviderProps,
  ref: Ref<HTMLDivElement>,
) => {
  const { children, className, style, theme, width } = props;
  const { colorMode, fontFamily, typography, ...restTokens } = theme;

  // TODO Move styles token generation from provider to UseTheme hook
  const typographyCss = useCallback(() => {
    if (Boolean(fontFamily) || Boolean(typography)) {
      return css`
        ${fontFamilyCss(fontFamily)};
        ${createTypographyStringMap(typography, fontFamily)}
      `;
    }
  }, [typography, fontFamily]);

  const providerCss = useCallback((theme) => {
    return css`
      ${cssRule(theme)};
    `;
  }, []);

  const containerCss = useCallback(() => {
    if (width != null) {
      return css`
        --provider-width: ${width}px;
      `;
    }
  }, [width]);

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className={clsx(
          className,
          providerCss(restTokens),
          typographyCss(),
          containerCss(),
        )}
        data-theme-provider=""
        ref={ref}
        style={{ colorScheme: `${colorMode}`, ...style }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const ThemeProvider = forwardRef(_ThemeProvider);
