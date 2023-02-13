import { createStyleObject } from "@capsizecss/core";

import arial from "@capsizecss/metrics/arial";
import inter from "@capsizecss/metrics/inter";
import rubik from "@capsizecss/metrics/rubik";
import roboto from "@capsizecss/metrics/roboto";
import ubuntu from "@capsizecss/metrics/ubuntu";
import poppins from "@capsizecss/metrics/poppins";
import notoSans from "@capsizecss/metrics/notoSans";
import openSans from "@capsizecss/metrics/openSans";
import montserrat from "@capsizecss/metrics/montserrat";
import nunitoSans from "@capsizecss/metrics/nunitoSans";

export type fontFamilyTypes =
  | "poppins"
  | "inter"
  | "roboto"
  | "rubik"
  | "ubuntu"
  | "notoSans"
  | "openSans"
  | "montserrat"
  | "nunitoSans";

const fontMetricsMap = {
  poppins,
  inter,
  roboto,
  rubik,
  ubuntu,
  notoSans,
  openSans,
  montserrat,
  nunitoSans,
};

type createTypographyStylesProps = {
  fontFamily?: fontFamilyTypes;
  capHeight: number;
  lineGap: number;
};

export const createTypographyStyles = (props: createTypographyStylesProps) => {
  const { capHeight, fontFamily, lineGap } = props;

  // if there is no font family, return an empty object
  if (!fontFamily) {
    return createStyleObject({
      capHeight,
      lineGap: lineGap,
      fontMetrics: arial,
    });
  }

  const styles = createStyleObject({
    capHeight,
    lineGap: lineGap,
    fontMetrics: fontMetricsMap[fontFamily],
  });

  return styles;
};
