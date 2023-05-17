import React, { useEffect, useState } from "react";
import webfontloader from "webfontloader";
import styled, { createGlobalStyle } from "styled-components";
import {
  ThemeProvider,
  TokensAccessor,
  defaultTokens,
} from "@design-system/theming";
import { createGlobalFontStack } from "@design-system/widgets";
import Color from "colorjs.io";

const StyledThemeProvider = styled(ThemeProvider)`
  display: inline-flex;
  min-width: 100%;
  min-height: 100%;
  padding: 16px;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  color: var(--color-fg);
`;
const { fontFaces } = createGlobalFontStack();

const GlobalStyles = createGlobalStyle`
   ${fontFaces}
`;

const tokensAccessor = new TokensAccessor(defaultTokens);

export const theming = (Story, args) => {
  const [theme, setTheme] = useState(tokensAccessor.getAllTokens());

  // Load the font if it's not the default
  useEffect(() => {
    if (
      args.globals.fontFamily &&
      args.globals.fontFamily !== "System Default"
    ) {
      webfontloader.load({
        google: {
          families: [`${args.globals.fontFamily}:300,400,500,700`],
        },
      });
    }
  }, [args.globals.fontFamily]);

  useEffect(() => {
    if (args.globals.accentColor) {
      let color;

      try {
        color = Color.parse(args.globals.accentColor);
      } catch (error) {
        console.error(error);
      }

      if (color) {
        tokensAccessor.updateSeedColor(args.globals.accentColor);

        setTheme((prevState) => {
          return {
            ...prevState,
            ...tokensAccessor.getColors(),
          };
        });
      }
    }
  }, [args.globals.accentColor]);

  useEffect(() => {
    if (args.globals.colorMode) {
      tokensAccessor.updateColorMode(args.globals.colorMode);

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getColors(),
        };
      });
    }
  }, [args.globals.colorMode]);

  useEffect(() => {
    if (args.globals.borderRadius) {
      tokensAccessor.updateBorderRadius({
        1: args.globals.borderRadius,
      });

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getBorderRadius(),
        };
      });
    }
  }, [args.globals.borderRadius]);

  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyles />
      <Story fontFamily={args.globals.fontFamily} />
    </StyledThemeProvider>
  );
};
