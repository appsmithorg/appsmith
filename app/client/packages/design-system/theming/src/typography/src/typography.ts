import { createFontStack, createStyleString } from "@capsizecss/core";
import { fontMetrics, TypographyVariant } from "./types";
import roboto from "@capsizecss/metrics/roboto";
import ubuntu from "@capsizecss/metrics/ubuntu";
import segoeUI from "@capsizecss/metrics/segoeUI";
import appleSystem from "@capsizecss/metrics/appleSystem";
import BlinkMacSystemFont from "@capsizecss/metrics/blinkMacSystemFont";

import type { FontFamily, Typography } from "./types";

export const getTypographyClassName = (key: keyof typeof TypographyVariant) => {
  return `wds-${TypographyVariant[key]}-text`;
};

export const createTypographyStringMap = (
  typography: Typography,
  fontFamily?: FontFamily,
) => {
  return Object.keys(typography).reduce((prev, current) => {
    const { capHeight, lineGap } = typography[current as keyof Typography];
    return (
      prev +
      `${createTypographyString(
        capHeight,
        lineGap,
        current as keyof typeof TypographyVariant,
        fontFamily,
      )}`
    );
  }, "");
};

export const createTypographyString = (
  capHeight: number,
  lineGap: number,
  typographyVariant: keyof typeof TypographyVariant,
  fontFamily?: FontFamily,
) => {
  // if there is no font family, use the default font stack
  if (!fontFamily) {
    return createStyleString(getTypographyClassName(typographyVariant), {
      capHeight,
      lineGap,
      fontMetrics: appleSystem,
    });
  }

  return createStyleString(getTypographyClassName(typographyVariant), {
    capHeight,
    lineGap,
    fontMetrics: fontMetrics[fontFamily],
  });
};

export const createGlobalFontStack = () => {
  return createFontStack(
    [appleSystem, BlinkMacSystemFont, segoeUI, roboto, ubuntu],
    {
      fontFaceFormat: "styleString",
    },
  );
};
