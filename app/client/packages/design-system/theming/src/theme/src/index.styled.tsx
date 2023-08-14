import { css } from "@emotion/css";
import kebabCase from "lodash/kebabCase";
import type { Theme } from "./types";

export const themeProviderCss = (theme: Theme) => {
  const { fontFamily, typography, ...rest } = theme;
  return css`
    font-family: ${fontFamily};

    ${typography};

    ${Object.keys(rest).map((key) => {
      if (typeof theme[key as keyof Theme] === "object") {
        return Object.keys(theme[key as keyof Theme] as object).map(
          (nestedKey) => {
            return `--${kebabCase(key)}-${kebabCase(nestedKey)}: ${
              //@ts-expect-error: type mismatch
              theme[key][nestedKey].value
            };`;
          },
        );
      } else {
        if (key === "rootUnit") return `--${kebabCase(key)}: ${theme[key]};`;
      }
    })}
  `;
};
