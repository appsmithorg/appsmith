import { css } from "@emotion/css";
import { useEffect, useState } from "react";
import { cssRule, getTypographyClassName } from "../../utils";

import type { Theme } from "../../theme";
import type { FontFamily, ThemeToken, Typography } from "../../token";

const fontFamilyCss = (fontFamily?: FontFamily) => {
  const fontFamilyCss =
    fontFamily && fontFamily !== "System Default"
      ? `${fontFamily}, sans-serif`
      : "-apple-system, 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Ubuntu'";

  return `font-family: ${fontFamilyCss}; --font-family: ${fontFamilyCss}`;
};

const getTypographyCss = (typography: Typography) => {
  return css`
    ${Object.keys(typography).reduce((prev, key) => {
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

interface UseCssTokensProps extends Theme {
  width: number | null;
}

export function useCssTokens(props: UseCssTokensProps) {
  const { color, colorMode, fontFamily, typography, width, ...restTokens } =
    props;

  const [colorClassName, setColorClassName] = useState<string>();
  const [colorModeClassName, setColorModeClassName] = useState<string>();
  const [fontFamilyClassName, setFontFamilyClassName] = useState<string>();
  const [typographyClassName, setTypographyClassName] = useState<string>();
  const [widthClassName, setWidthClassName] = useState<string>();
  const [providerClassName, setProviderClassName] = useState<string>();

  useEffect(() => {
    if (color != null) {
      setColorClassName(css`
        ${getColorCss(color)}
      `);
    }
  }, [color]);

  useEffect(() => {
    if (typography != null) {
      setTypographyClassName(css`
        ${getTypographyCss(typography)}
      `);
    }
  }, [typography]);

  useEffect(() => {
    if (fontFamily != null) {
      setFontFamilyClassName(css`
        ${fontFamilyCss(fontFamily)}
      `);
    }
  }, [fontFamily]);

  useEffect(() => {
    setProviderClassName(css`
      ${cssRule(restTokens)};
    `);
  }, [restTokens]);

  useEffect(() => {
    if (width != null) {
      setWidthClassName(css`
        --provider-width: ${width}px;
      `);
    }
  }, [width]);

  useEffect(() => {
    if (colorMode != null) {
      setColorModeClassName(css`
        color-scheme: ${colorMode};
      `);
    }
  }, [colorMode]);

  return {
    colorClassName,
    colorModeClassName,
    fontFamilyClassName,
    typographyClassName,
    widthClassName,
    providerClassName,
  };
}
