import React from "react";
import styled, { css } from "styled-components";
import kebabCase from "lodash/kebabCase";
import type { ReactNode } from "react";
import type themeTokens from "../tokens/themeTokens.json";

type Theme = typeof themeTokens;

export interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
}

/**
 * creates locally scoped css variables
 *
 */
const StyledProvider = styled.div<ThemeProviderProps>`
  ${({ theme }) => {
    return css`
      ${Object.keys(theme).map((key) => {
        return Object.keys(theme[key]).map((nestedKey) => {
          return `--${kebabCase(key)}-${kebabCase(nestedKey)}: ${
            theme[key][nestedKey].value
          };`;
        });
      })}
    `;
  }}
`;

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, theme } = props;

  return <StyledProvider theme={theme}>{children}</StyledProvider>;
};
