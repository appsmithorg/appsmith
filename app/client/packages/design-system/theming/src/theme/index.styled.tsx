import kebabCase from "lodash/kebabCase";
import styled, { css } from "styled-components";
import type { ThemeProviderProps } from "./types";

export const StyledProvider = styled.div<ThemeProviderProps>`
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
