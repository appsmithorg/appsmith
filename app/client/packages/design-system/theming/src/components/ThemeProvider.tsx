import React from "react";
import styled, { css } from "styled-components";
import kebabCase from "lodash/kebabCase";
import type { ReactNode } from "react";
import type { ThemeTokens } from "../";

export interface ThemeProviderProps {
  theme: ThemeTokens;
  children: ReactNode;
  className?: string;
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
  const { children, className, theme } = props;

  return (
    <StyledProvider className={className} theme={theme}>
      {children}
    </StyledProvider>
  );
};
