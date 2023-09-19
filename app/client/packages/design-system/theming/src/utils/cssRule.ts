import kebabCase from "lodash/kebabCase";
import type { ThemeToken } from "../token";

export const cssRule = (className: string, token: ThemeToken) => {
  let styles = "";

  Object.keys(token).forEach((key) => {
    const tokenProp = token[key as keyof ThemeToken];
    if (tokenProp) {
      styles += `--${kebabCase(
        tokenProp?.type as unknown as string,
      )}-${kebabCase(key)}: ${tokenProp?.value};`;
    }
  });

  return `${className} {${styles}}`;
};
