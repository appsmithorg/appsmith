import kebabCase from "lodash/kebabCase";
import { createTypographyStringMap } from "../typography";
import type { Theme } from "./types";
import { StyleSheet } from "@emotion/sheet";

export const themeProviderCss = (providerCLassName: string, theme: Theme) => {
  const sheet = new StyleSheet({ key: "", container: document.head });
  const { fontFamily, rootUnit, typography, ...rest } = theme;

  sheet.insert(`
    .${providerCLassName}
      {
        ${getCssLine(rest)}
      }
  `);

  if (fontFamily) {
    sheet.insert(`
    .${providerCLassName}
      {
        font-family: ${fontFamily};
      }
  `);
  }

  if (rootUnit) {
    sheet.insert(`
    .${providerCLassName}
      {
        --root-unit: ${rootUnit}
      }
  `);
  }

  if (typography) {
    sheet.insert(
      createTypographyStringMap(typography, fontFamily, providerCLassName),
    );
  }
};

const getCssLine = (theme: Partial<Theme>) => {
  let css = "";

  Object.keys(theme).forEach((key) => {
    if (typeof theme[key as keyof Theme] === "object") {
      return Object.keys(theme[key as keyof Theme] as object).forEach(
        (nestedKey) => {
          css += `--${kebabCase(key)}-${kebabCase(nestedKey)}: ${
            //@ts-expect-error: type mismatch
            theme[key][nestedKey].value
          };`;
        },
      );
    }
  });

  return css;
};
