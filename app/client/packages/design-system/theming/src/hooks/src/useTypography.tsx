import { useEffect, useState } from "react";

import { createStyleObject } from "@capsizecss/core";
import appleSystem from "@capsizecss/metrics/appleSystem";

import { FONT_METRICS, TYPOGRAPHY_VARIANTS } from "../../token";
import type {
  FontFamily,
  TokenScaleConfig,
  Typography,
  TypographyVariantMetric,
} from "../../token";
import { calculateScales } from "./calculateScales";

const getFontMetrics = (fontFamily?: FontFamily) => {
  return !Boolean(fontFamily) ||
    fontFamily == null ||
    fontFamily === "System Default"
    ? appleSystem
    : FONT_METRICS[fontFamily];
};

export const getTypography = (
  typography: TokenScaleConfig,
  userDensity = 1,
  userSizing = 1,
  fontFamily?: FontFamily,
) => {
  const { userDensityRatio = 1, userSizingRatio = 1, V, ...rest } = typography;
  const ratio = userDensity * userDensityRatio + userSizing * userSizingRatio;
  const scales = calculateScales({
    V: V * ratio,
    ...rest,
  });

  const styles = scales.reduce(
    (metrics: TypographyVariantMetric[], currentValue) => {
      const typographyStyle = createStyleObject({
        capHeight: currentValue,
        lineGap: currentValue,
        fontMetrics: getFontMetrics(fontFamily),
      });

      metrics.push({
        fontSize: `${typographyStyle.fontSize}`,
        lineHeight: `${typographyStyle.lineHeight}`,
        before: typographyStyle["::before"],
        after: typographyStyle["::after"],
      });
      return metrics;
    },
    [],
  );

  return Object.keys(TYPOGRAPHY_VARIANTS).reduce((prev, current, index) => {
    return {
      ...prev,
      [current]: styles[index],
    };
  }, {} as Typography);
};

export const useTypography = (
  config: TokenScaleConfig,
  fontFamily?: FontFamily,
  userDensity = 1,
  userSizing = 1,
) => {
  const [typography, setTypography] = useState<Typography | null>(null);

  useEffect(() => {
    setTypography(getTypography(config, userDensity, userSizing, fontFamily));
  }, [userDensity, userSizing, fontFamily, config]);

  return {
    typography,
  };
};
