import kebabCase from "lodash/kebabCase";
import isObject from "lodash/isObject";
import type { Theme } from "../theme";

export const cssRule = (tokens: Theme) => {
  let styles = "";

  Object.values(tokens).forEach((token) => {
    if (token == null) return;

    if (isObject(token)) {
      Object.keys(token).forEach((key) => {
        //@ts-expect-error: type mismatch
        styles += `--${kebabCase(token[key].type)}-${kebabCase(key)}: ${
          //@ts-expect-error: type mismatch
          token[key].value
        };`;
      });
    }
  });

  return styles;
};
