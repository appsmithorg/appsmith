import React from "react";
import {
  createGlobalFontStack,
  createTypographyStylesMap,
} from "../typography";
import { StyledProvider } from "./index.styled";
import { ThemeContext } from "./ThemeContext";
import { createGlobalStyle } from "styled-components";

import type { ThemeProviderProps } from "./types";

const { fontFaces } = createGlobalFontStack();

const GlobalStyles = createGlobalStyle`
   ${fontFaces}
`;

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, className, theme } = props;
  const { typography, ...rest } = theme;

  return (
    <ThemeContext.Provider
      value={{
        ...rest,
        typography: createTypographyStylesMap(typography),
      }}
    >
      <GlobalStyles />
      <StyledProvider className={className} data-theme-provider="" theme={rest}>
        {children}
      </StyledProvider>
    </ThemeContext.Provider>
  );
};
