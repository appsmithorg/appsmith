import React, { useEffect, useState } from "react";
import webfontloader from "webfontloader";
import styled, { createGlobalStyle } from "styled-components";
import { ThemeProvider, TokensAccessor } from "@design-system/theming";
import { createGlobalFontStack } from "@design-system/widgets";

const StyledContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  padding: 8px;
  align-items: center;
  justify-content: center;
`;
const { fontFaces } = createGlobalFontStack();

const GlobalStyles = createGlobalStyle`
   ${fontFaces}
`;

const tokensAccessor = new TokensAccessor();

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
      tokensAccessor.updateSeedColor(args.globals.accentColor);

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getColors(),
        };
      });
    }
  }, [args.globals.accentColor]);

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
    <StyledContainer>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <Story fontFamily={args.globals.fontFamily} />
      </ThemeProvider>
    </StyledContainer>
  );
};
