import React, { useRef } from "react";

import { injectGlobal } from "@emotion/css";
import clsx from "clsx";

import { useCssTokens } from "../../hooks";
import { globalFontStack } from "../../utils/globalFontStack";
import { ThemeContext } from "./ThemeContext";
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
    typographyClassName,
  } = useCssTokens({ ...theme });

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
        )}
        data-theme-provider=""
        ref={providerRef}
        style={style}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
