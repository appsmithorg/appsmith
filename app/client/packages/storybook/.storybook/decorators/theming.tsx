import * as React from "react";
import styled from "styled-components";
// @ts-ignore
import isChromatic from "chromatic/isChromatic";
import { ThemeProvider, useTheme } from "@appsmith/wds-theming";

const StyledThemeProvider = styled(ThemeProvider)`
  display: inline-flex;
  min-width: 100%;
  min-height: 100%;
  padding: 16px;
  align-items: center;
  justify-content: center;
`;

export const theming = (Story, args) => {
  const { theme } = useTheme({
    seedColor: args.globals.seedColor,
    colorMode: args.parameters.colorMode || args.globals.colorMode,
    borderRadius: args.globals.borderRadius,
    fontFamily: args.globals.fontFamily,
    userDensity: args.globals.userDensity,
    userSizing: args.globals.userSizing,
  });

  return (
    <StyledThemeProvider
      className={isChromatic() ? "is-chromatic" : ""}
      theme={theme}
    >
      <Story />
    </StyledThemeProvider>
  );
};
