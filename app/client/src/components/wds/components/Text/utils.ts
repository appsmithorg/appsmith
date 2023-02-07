import { createFontStack, createStyleObject } from "@capsizecss/core";

import poppins from "@capsizecss/metrics/poppins";
import inter from "@capsizecss/metrics/inter";
import roboto from "@capsizecss/metrics/roboto";
import rubik from "@capsizecss/metrics/rubik";
import ubuntu from "@capsizecss/metrics/ubuntu";
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
  const { capHeight, fontFamily } = props;

  // if there is no font family, return an empty object
  if (!fontFamily) {
    return {};
  }
  const styles = createStyleObject({
    capHeight,
    fontMetrics: fontMetricsMap[fontFamily],
  });

  return styles;
};
