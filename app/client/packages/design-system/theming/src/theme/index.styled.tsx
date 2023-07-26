import type { PickRename } from "@design-system/widgets";
import kebabCase from "lodash/kebabCase";
import styled, { css } from "styled-components";
import type { Theme } from "./types";

type StyledProviderProps = PickRename<
  Theme,
  {
    typography: "$typography";
    fontFamily: "$fontFamily";
  }
>;

export const StyledProvider = styled.div<StyledProviderProps>`
  ${({ $fontFamily, $typography, theme }) => {
    return css`
      font-family: ${$fontFamily};
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
