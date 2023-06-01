import React from "react";
import { getTypographyStyles } from "../typography";
import styled, { css } from "styled-components";
import kebabCase from "lodash/kebabCase";
import { ThemeContext } from "./ThemeContext";

import type { ReactNode } from "react";
import type { Theme } from "./types";

interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
  className?: string;
}

const StyledProvider = styled.div<ThemeProviderProps>`
  ${({ theme }) => {
    return css`
      ${Object.keys(theme).map((key) => {
        if (typeof theme[key] === "object") {
          return Object.keys(theme[key]).map((nestedKey) => {
            return `--${kebabCase(key)}-${kebabCase(nestedKey)}: ${
              theme[key][nestedKey].value
            };`;
          });
        } else {
          if (key === "rootUnit")
            return `--${kebabCase(key)}: ${theme[key]}px;`;
        }
      })}
    `;
  }}
`;

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, className, theme } = props;
  const { fontFamily, rootUnit, typography, ...rest } = theme;

  return (
    <ThemeContext.Provider
      value={{
        ...rest,
        typography: getTypographyStyles({
          rootUnit,
          typography,
          fontFamily,
        }),
      }}
    >
      <StyledProvider
        className={className}
        data-theme-provider=""
        theme={{ rootUnit, ...rest }}
      >
        {children}
      </StyledProvider>
    </ThemeContext.Provider>
  );
};
