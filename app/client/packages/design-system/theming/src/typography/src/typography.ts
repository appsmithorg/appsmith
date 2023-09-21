import { createFontStack, createStyleString } from "@capsizecss/core";
import { FONT_METRICS, TYPOGRAPHY_VARIANTS } from "./types";
import roboto from "@capsizecss/metrics/roboto";
import ubuntu from "@capsizecss/metrics/ubuntu";
import segoeUI from "@capsizecss/metrics/segoeUI";
import appleSystem from "@capsizecss/metrics/appleSystem";
import BlinkMacSystemFont from "@capsizecss/metrics/blinkMacSystemFont";

import type { FontFamily, Typography } from "./types";

export const getTypographyClassName = (
  key: keyof typeof TYPOGRAPHY_VARIANTS,
) => {
  return `wds-${TYPOGRAPHY_VARIANTS[key]}-text`;
};

export const createTypographyStringMap = (
  typography: Typography,
  containerCLassName: string,
  fontFamily?: FontFamily,
) => {
  return Object.keys(typography).reduce((prev, current) => {
    const { capHeight, lineGap } = typography[current as keyof Typography];
    return (
      prev +
      `${createTypographyString(
        capHeight,
        lineGap,
        current as keyof typeof TYPOGRAPHY_VARIANTS,
        containerCLassName,
        fontFamily,
      )}`
    );
  }, "");
};

export const createTypographyString = (
  capHeight: number,
  lineGap: number,
  typographyVariant: keyof typeof TYPOGRAPHY_VARIANTS,
  containerCLassName: string,
  fontFamily?: FontFamily,
) => {
  // if there is no font family, use the default font stack
  if (!fontFamily || fontFamily === "System Default") {
    return createStyleString(
      `${containerCLassName} .${getTypographyClassName(typographyVariant)}`,
      {
        capHeight,
        lineGap,
        fontMetrics: appleSystem,
      },
    );
  }

  return createStyleString(
    `${containerCLassName} .${getTypographyClassName(typographyVariant)}`,
    {
      capHeight,
      lineGap,
      fontMetrics: FONT_METRICS[fontFamily],
    },
  );
};

export const createGlobalFontStack = () => {
  return createFontStack(
    [appleSystem, BlinkMacSystemFont, segoeUI, roboto, ubuntu],
    {
      fontFaceFormat: "styleString",
    },
  );
};
