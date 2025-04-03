import clsx from "clsx";
import React, { useRef } from "react";
import { injectGlobal } from "@emotion/css";

import { useCssTokens } from "../../hooks";
import { ThemeContext } from "./ThemeContext";
import { globalFontStack } from "../../utils/globalFontStack";

import type { ThemeProviderProps } from "./types";

injectGlobal(globalFontStack());

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, className, style, theme } = props;
  const providerRef = useRef(null);

  const {
    colorClassName,
    colorModeClassName,
    fontFamilyClassName,
    providerClassName,
    scrollbarWidthClassName,
    typographyClassName,
  } = useCssTokens(theme);

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className={clsx(
          className,
          colorClassName,
          colorModeClassName,
          fontFamilyClassName,
          providerClassName,
          typographyClassName,
          scrollbarWidthClassName,
        )}
        data-theme-provider=""
        ref={providerRef}
        // Resetting the ADS OpenType features and type settings, so they don't leak into widgets, see https://github.com/appsmithorg/appsmith/blob/release/app/client/packages/design-system/ads/src/__theme__/default/index.css?plain=1#L310
        style={{
          ...style,
          fontFeatureSettings: "'ss03' 0",
          letterSpacing: "0",
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
