import { createStyleObject } from "@capsizecss/core";
import { fontMetricsMap } from "../utils/TokensAccessor/types";
import type { fontFamilyTypes } from "../utils/TokensAccessor/types";
import appleSystem from "@capsizecss/metrics/appleSystem";

export const createTypographyStyles = (
  capHeight: number,
  lineGap: number,
  fontFamily?: fontFamilyTypes,
) => {
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
