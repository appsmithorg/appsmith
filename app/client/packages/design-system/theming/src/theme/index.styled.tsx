import kebabCase from "lodash/kebabCase";
import styled, { css } from "styled-components";
import type { ThemeProviderProps } from "./types";

interface StyledProviderProps extends ThemeProviderProps {
  $typography?: string;
}

export const StyledProvider = styled.div<StyledProviderProps>`
  ${({ $typography, theme }) => {
    return css`
      ${$typography}
      ${Object.keys(theme).map((key) => {
        if (typeof theme[key] === "object") {
          return Object.keys(theme[key]).map((nestedKey) => {
            return `--${kebabCase(key)}-${kebabCase(nestedKey)}: ${
              theme[key][nestedKey].value
            };`;
          });
        } else {
          if (key === "rootUnit") return `--${kebabCase(key)}: ${theme[key]};`;
        }
      })}
    `;
  }}
`;
