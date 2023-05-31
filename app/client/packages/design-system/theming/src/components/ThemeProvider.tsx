import type {
  fontFamilyTypes,
  Theme,
  Typography,
} from "../utils/TokensAccessor/types";
import { createTypographyStyles } from "./typography";
import React from "react";
import styled, { css } from "styled-components";
import kebabCase from "lodash/kebabCase";
import type { ReactNode } from "react";
import { ThemeContext } from "./ThemeContext";

export interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
  className?: string;
}

export interface TypographyStyles {
  rootUnit: number;
  typography?: Typography;
  fontFamily?: fontFamilyTypes;
}

const getTypographyStyles = ({
  fontFamily,
  rootUnit,
  typography,
}: TypographyStyles) => {
  if (!typography) {
    return {
      body: css`
        ${createTypographyStyles(rootUnit * 2.5, rootUnit * 2)}
      `,
    };
  }

  const { body, footnote, heading } = typography;

  const headingStyles = heading
    ? createTypographyStyles(
        rootUnit * heading.capHeight,
        rootUnit * heading.lineGap,
        heading.fontFamily ?? fontFamily,
      )
    : "";

  const bodyStyles = body
    ? createTypographyStyles(
        rootUnit * body.capHeight,
        rootUnit * body.lineGap,
        body.fontFamily ?? fontFamily,
      )
    : "";

  const footnoteStyles = footnote
    ? createTypographyStyles(
        rootUnit * footnote.capHeight,
        rootUnit * footnote.lineGap,
        footnote.fontFamily ?? fontFamily,
      )
    : "";

  return {
    heading: css`
      ${headingStyles}
    `,
    body: css`
      ${bodyStyles}
    `,
    footnote: css`
      ${footnoteStyles}
    `,
  };
};

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
