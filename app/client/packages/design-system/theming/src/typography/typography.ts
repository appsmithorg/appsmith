import { createStyleObject, createFontStack } from "@capsizecss/core";
import { css } from "styled-components";

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

import type { FontFamily, Typography } from "./types";

export const createTypographyStylesMap = (typography: Typography) => {
  return Object.keys(typography).reduce((prev, current) => {
    const { capHeight, fontFamily, lineGap } =
      typography[current as keyof Typography];
    return {
      ...prev,
      [current]: css`
        ${createTypographyStyles(capHeight, lineGap, fontFamily)}
      `,
    };
  }, {});
};

export const createTypographyStyles = (
  capHeight: number,
  lineGap: number,
  fontFamily?: FontFamily,
) => {
  // if there is no font family, use the default font stack
  if (!fontFamily) {
    const styles = createStyleObject({
      capHeight,
      lineGap,
      fontMetrics: appleSystem,
    });

    return {
      fontFamily: `-apple-system, BlinkMacSystemFont, "-apple-system Fallback: Segoe UI", "-apple-system Fallback: Roboto", "-apple-system Fallback: Ubuntu"`,
      ...styles,
    };
  }

  const styles = createStyleObject({
    capHeight,
    lineGap,
    fontMetrics: fontMetrics[fontFamily],
  });

  return {
    fontFamily: `"${fontFamily}"`,
    ...styles,
  };
};

export const createGlobalFontStack = () => {
  return createFontStack(
    [appleSystem, BlinkMacSystemFont, segoeUI, roboto, ubuntu],
    {
      fontFaceFormat: "styleString",
    },
  );
};
