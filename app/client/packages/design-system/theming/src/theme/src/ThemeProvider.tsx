import React from "react";
import { createGlobalStyle } from "styled-components";

import { ThemeContext } from "./ThemeContext";
import { StyledProvider } from "./index.styled";
import { createGlobalFontStack } from "../../typography";

import type { ThemeProviderProps } from "./types";

const { fontFaces } = createGlobalFontStack();
const GlobalStyles = createGlobalStyle`${fontFaces}`;

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, className, style, theme } = props;
  const { fontFamily, typography, ...rest } = theme;

  return (
    <ThemeContext.Provider
      value={{
        ...rest,
      }}
    >
      <GlobalStyles />
      <StyledProvider
        $fontFamily={fontFamily}
        $typography={typography}
        className={className}
        data-theme-provider=""
        style={style}
        theme={rest}
      >
        {children}
      </StyledProvider>
    </ThemeContext.Provider>
  );
};
