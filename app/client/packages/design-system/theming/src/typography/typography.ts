import { createFontStack, createStyleString } from "@capsizecss/core";

import arial from "@capsizecss/metrics/arial";
import inter from "@capsizecss/metrics/inter";
import rubik from "@capsizecss/metrics/rubik";
import roboto from "@capsizecss/metrics/roboto";
import ubuntu from "@capsizecss/metrics/ubuntu";
import poppins from "@capsizecss/metrics/poppins";
import segoeUI from "@capsizecss/metrics/segoeUI";
import openSans from "@capsizecss/metrics/openSans";
import notoSans from "@capsizecss/metrics/notoSans";
import montserrat from "@capsizecss/metrics/montserrat";
import nunitoSans from "@capsizecss/metrics/nunitoSans12pt";
import appleSystem from "@capsizecss/metrics/appleSystem";
import BlinkMacSystemFont from "@capsizecss/metrics/blinkMacSystemFont";

export const fontMetrics = {
  Poppins: poppins,
  Inter: inter,
  Roboto: roboto,
  Rubik: rubik,
  Ubuntu: ubuntu,
  "Noto Sans": notoSans,
  "Open Sans": openSans,
  Montserrat: montserrat,
  "Nunito Sans": nunitoSans,
  Arial: arial,
  "-apple-system": appleSystem,
  BlinkMacSystemFont: BlinkMacSystemFont,
  "Segoe UI": segoeUI,
} as const;

import { TypographyVariant } from "./types";
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
