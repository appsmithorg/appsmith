import { createStyleObject, createFontStack } from "@capsizecss/core";

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
import nunitoSans from "@capsizecss/metrics/nunitoSans";
import appleSystem from "@capsizecss/metrics/appleSystem";
import BlinkMacSystemFont from "@capsizecss/metrics/blinkMacSystemFont";

export const fontMetricsMap = {
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

export type fontFamilyTypes = keyof typeof fontMetricsMap;

type createTypographyStylesProps = {
  fontFamily?: fontFamilyTypes;
  capHeight: number;
  lineGap: number;
};

export const createTypographyStyles = (props: createTypographyStylesProps) => {
  const { capHeight, fontFamily, lineGap } = props;

  // if there is no font family, use the default font stack
  if (!fontFamily) {
    const styles = createStyleObject({
      capHeight,
      lineGap,
      fontMetrics: appleSystem,
    });

    return {
      fontFamily: `-apple-system, BlinkMacSystemFont, "-apple-system Fallback: Segoe UI", "-apple-system Fallback: Roboto"`,
      ...styles,
    };
  }

  const styles = createStyleObject({
    capHeight,
    lineGap,
    fontMetrics: fontMetricsMap[fontFamily],
  });

  return {
    fontFamily: `"${fontFamily}"`,
    ...styles,
  };
};

/**
 * create a global font stack
 *
 * @returns
 */
export const createGlobalFontStack = () => {
  return createFontStack([appleSystem, BlinkMacSystemFont, segoeUI, roboto], {
    fontFaceFormat: "styleString",
  });
};
