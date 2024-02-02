import { useEffect, useState } from "react";
import { FONT_METRICS, TYPOGRAPHY_VARIANTS } from "../../token";
import { calculateScales } from "./calculateScales";
import { createStyleObject } from "@capsizecss/core";
import appleSystem from "@capsizecss/metrics/appleSystem";

import type { FluidConfig } from "./types";
import type {
  FontFamily,
  Typography,
  TypographyVariantMetric,
} from "../../token";
import type { ScaleConfig } from "./types";

const getFontMetrics = (fontFamily?: FontFamily) => {
  return !Boolean(fontFamily) ||
    fontFamily == null ||
    fontFamily === "System Default"
    ? appleSystem
    : FONT_METRICS[fontFamily];
};

export const getFluidTypography = (
  maxVw: number,
  minVw: number,
  typography: ScaleConfig,
  userDensity = 1,
  userSizing = 1,
  fontFamily?: FontFamily,
) => {
  const {
    maxV,
    minV,
    userDensityRatio = 1,
    userSizingRatio = 1,
    ...rest
  } = typography;

  const ratio = userDensity * userDensityRatio + userSizing * userSizingRatio;

  const scales = calculateScales(
    {
      minV: minV * ratio,
      maxV: maxV * ratio,
      ...rest,
    },
    minVw,
    maxVw,
  );

  const styles = scales.reduce(
    (metrics: TypographyVariantMetric[], currentValue) => {
      const { minSize } = currentValue;
      const minTypographyStyle = createStyleObject({
        capHeight: minSize,
        lineGap: minSize,
        fontMetrics: getFontMetrics(fontFamily),
      });

      metrics.push({
        fontSize: `${minTypographyStyle.fontSize}`,
        lineHeight: `${minTypographyStyle.lineHeight}`,
        before: minTypographyStyle["::before"],
        after: minTypographyStyle["::after"],
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

export const useFluidTypography = (
  fluidConfig: FluidConfig,
  fontFamily?: FontFamily,
  userDensity = 1,
  userSizing = 1,
) => {
  const { maxVw, minVw, typography: typographyConfig } = fluidConfig;
  const [typography, setTypography] = useState<Typography | null>(null);

  useEffect(() => {
    setTypography(
      getFluidTypography(
        maxVw,
        minVw,
        typographyConfig,
        userDensity,
        userSizing,
        fontFamily,
      ),
    );
  }, [userDensity, userSizing, fontFamily, maxVw, minVw, typographyConfig]);

  return {
    typography,
  };
};
