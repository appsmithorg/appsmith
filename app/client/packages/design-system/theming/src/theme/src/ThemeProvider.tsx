import React, { useRef } from "react";
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

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className={cx(className, themeProviderCss(theme))}
        data-theme-provider=""
        ref={provider}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
