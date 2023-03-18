import React, { useEffect } from "react";
import webfontloader from "webfontloader";
import styled, { createGlobalStyle } from "styled-components";

import { createCSSVars, createGlobalFontStack } from "@design-system/wds";

const StyledContainer = styled.div`
  ${createCSSVars}

  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
`;
const { fontFaces } = createGlobalFontStack();

const GlobalStyles = createGlobalStyle`
   ${fontFaces}
`;

export const theming = (Story, args) => {
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

  return (
    <StyledContainer
      accentColor={args.globals.accentColor || "#553DE9"}
      borderRadius={args.globals.borderRadius}
    >
      <GlobalStyles />
      <Story fontFamily={args.globals.fontFamily} />
    </StyledContainer>
  );
};
