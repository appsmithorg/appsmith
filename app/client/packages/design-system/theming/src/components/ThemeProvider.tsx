import React from "react";
import styled, { css } from "styled-components";
import kebabCase from "lodash/kebabCase";
import type { ReactNode, CSSProperties } from "react";
import type { ThemeTokens } from "../";

export interface ThemeProviderProps {
  theme: ThemeTokens;
  children: ReactNode;
  UNSAFE_className?: string;
  UNSAFE_style?: CSSProperties;
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
  const { children, theme, UNSAFE_className, UNSAFE_style } = props;

  return (
    <StyledProvider
      className={UNSAFE_className}
      style={UNSAFE_style}
      theme={theme}
    >
      {children}
    </StyledProvider>
  );
};
