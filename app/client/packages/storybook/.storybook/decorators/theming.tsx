import * as React from "react";
import { useEffect, useState } from "react";
import * as webfontloader from "webfontloader";
import styled from "styled-components";
import {
  ThemeProvider,
  TokensAccessor,
  defaultTokens,
  useTheme,
} from "@design-system/theming";
import Color from "colorjs.io";

const StyledThemeProvider = styled(ThemeProvider)`
  display: inline-flex;
  width: 100%;
  height: 100%;
  padding: 16px;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  color: var(--color-fg);
`;

export const theming = (Story, args) => {
  const { theme } = useTheme({
    seedColor: args.globals.accentColor,
    colorMode: args.globals.colorMode,
    borderRadius: args.globals.borderRadius,
    fontFamily: args.globals.fontFamily,
    rootUnit: args.globals.rootUnit,
  });

  return (
    <StyledThemeProvider theme={theme}>
      <Story />
    </StyledThemeProvider>
  );
};
