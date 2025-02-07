import { kebabCase, isObject } from "lodash";
import type { Theme } from "../theme";
import { objectKeys } from "@appsmith/utils";
import type { TypographyVariantMetric } from "../token";

export const cssRule = (tokens: Theme) => {
  let styles = "";

  objectKeys(tokens).forEach((tokenKey) => {
    const token = tokens[tokenKey];

    if (token == null) return;

    if (isObject(token)) {
      if (tokenKey === "typography") {
        styles += objectKeys(token as NonNullable<Theme["typography"]>).reduce(
          (prev: string, key) => {
            return `${prev} --font-size-${key}: ${(token[key] as TypographyVariantMetric).fontSize};`;
          },
          "",
        );

        return;
      }

      objectKeys(token).forEach((key) => {
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
