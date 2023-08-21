import React, { useEffect, useRef } from "react";
import { createGlobalFontStack } from "../typography";
import { themeProviderCss } from "./index.styled";
import { ThemeContext } from "./ThemeContext";
import { injectGlobal, cx } from "@emotion/css";

import type { ThemeProviderProps } from "./types";

const { fontFaces } = createGlobalFontStack();
injectGlobal(fontFaces);

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, className, theme } = props;
  const provider = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (provider.current) {
      themeProviderCss(provider.current.className, theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      <div className={cx(className)} data-theme-provider="" ref={provider}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
