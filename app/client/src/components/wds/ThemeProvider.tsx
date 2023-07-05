import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  ThemeProvider as WDSThemeProvider,
  createGlobalFontStack,
  useTheme,
} from "@design-system/theming";
import type { ColorMode } from "@design-system/theming";

const StyledThemeProvider = styled(WDSThemeProvider)`
  color: var(--color-fg);
`;
const { fontFaces } = createGlobalFontStack();

const GlobalStyles = createGlobalStyle`
   ${fontFaces}
`;

type ThemeProviderProps = {
  children: React.ReactNode;
  seedColor?: string;
  colorMode?: ColorMode;
  borderRadius?: string;
};

export function ThemeProvider(props: ThemeProviderProps) {
  const { children, ...rest } = props;
  const { theme } = useTheme(rest);

  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyles />
      {children}
    </StyledThemeProvider>
  );
}
