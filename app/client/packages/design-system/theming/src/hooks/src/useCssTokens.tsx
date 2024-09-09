import { css } from "@emotion/css";
import { useMemo } from "react";
import { objectKeys } from "@appsmith/utils";

import type { Theme } from "../../theme";
import type { ThemeToken, Typography } from "../../token";
import { cssRule, getTypographyClassName } from "../../utils";

const fontFamilyCss = () => {
  const fontFamilyCss =
    "-apple-system, 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Ubuntu', sans-serif";

  return `font-family: ${fontFamilyCss}; --font-family: ${fontFamilyCss}`;
};

const getTypographyCss = (typography: Typography) => {
  return css`
    ${objectKeys(typography).reduce((prev, key) => {
      const currentKey = key as keyof Typography;
      const { after, before, fontSize, lineHeight } = typography[currentKey];
      return (
        prev +
        `
        & .${getTypographyClassName(currentKey)} {
          font-size: ${fontSize};
          line-height: ${lineHeight};
          &::before {
            content: "";
            display: table;
            margin-bottom: ${before.marginBottom};
          }
          &::after {
            content: "";
            display: table;
            margin-top: ${after.marginTop};
          }
        }
        --${currentKey}-font-size: ${fontSize};
        --${currentKey}-line-height: ${lineHeight};
        --${currentKey}-margin-start: ${after.marginTop};
        --${currentKey}-margin-end: ${before.marginBottom};
      `
      );
    }, "")}
  `;
};

const getColorCss = (color: ThemeToken["color"]) => {
  return css`
    background: var(--color-bg);
    color: var(--color-fg);
    ${cssRule({ color })};
  `;
};

export function useCssTokens(props: Theme) {
  const { color, colorMode, typography, ...restTokens } = props;

  const colorClassName = useMemo(() => {
    if (color != null) {
      return css`
        ${getColorCss(color)}
      `;
    }
  }, [color]);

  const typographyClassName = useMemo(() => {
    if (typography != null) {
      return css`
        ${getTypographyCss(typography)}
      `;
    }
  }, [typography]);

  const fontFamilyClassName = css`
    ${fontFamilyCss()}
  `;

  const providerClassName = useMemo(() => {
    return css`
      ${cssRule(restTokens)};
    `;
  }, [restTokens]);

  const colorModeClassName = useMemo(() => {
    if (colorMode != null) {
      return css`
        color-scheme: ${colorMode};
      `;
    }
  }, [colorMode]);

  return {
    colorClassName,
    colorModeClassName,
    fontFamilyClassName,
    typographyClassName,
    providerClassName,
  };
}
