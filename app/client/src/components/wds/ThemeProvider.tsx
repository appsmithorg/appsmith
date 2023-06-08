import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  ThemeProvider as WDSThemeProvider,
  TokensAccessor,
  defaultTokens,
} from "@design-system/theming";
import { createGlobalFontStack } from "@design-system/theming";
import Color from "colorjs.io";
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
  const {
    borderRadius = "0px",
    children,
    colorMode = "light",
    seedColor,
  } = props;
  const tokensAccessor = new TokensAccessor({
    ...defaultTokens,
    borderRadius: {
      "1": borderRadius,
    },
    colorMode,
    seedColor,
  });

  const [theme, setTheme] = useState(tokensAccessor.getAllTokens());

  useEffect(() => {
    if (seedColor) {
      let color;

      try {
        color = Color.parse(seedColor);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }

      if (color) {
        tokensAccessor.updateSeedColor(seedColor);

        setTheme((prevState) => {
          return {
            ...prevState,
            ...tokensAccessor.getColors(),
          };
        });
      }
    }
  }, [seedColor]);

  useEffect(() => {
    if (colorMode) {
      tokensAccessor.updateColorMode(colorMode);

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getColors(),
        };
      });
    }
  }, [colorMode]);

  useEffect(() => {
    if (borderRadius) {
      tokensAccessor.updateBorderRadius({
        1: borderRadius,
      });

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getBorderRadius(),
        };
      });
    }
  }, [borderRadius]);

  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyles />
      {children}
    </StyledThemeProvider>
  );
}
