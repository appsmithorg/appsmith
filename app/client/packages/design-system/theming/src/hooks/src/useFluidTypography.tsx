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
      const { maxSize, minSize, r, v } = currentValue;
      const minTypographyStyle = createStyleObject({
        capHeight: minSize,
        lineGap: minSize,
        fontMetrics: getFontMetrics(fontFamily),
      });
      const maxTypographyStyle = createStyleObject({
        capHeight: maxSize,
        lineGap: maxSize,
        fontMetrics: getFontMetrics(fontFamily),
      });

      // Calculate the ratio between the initial config value and the font size
      const fontSizeRatio =
        Number(minTypographyStyle.fontSize.replace("px", "")) / minSize;

      // The ratio for lineHeight is a constant since it doesn't change based on passing values
      const lineHeightRatio = 2;

      metrics.push({
        fontSize: `clamp(${minTypographyStyle.fontSize}, calc((${v} * var(--provider-width) / 100 + ${r}px) * ${fontSizeRatio}), ${maxTypographyStyle.fontSize})`,
        lineHeight: `clamp(${minTypographyStyle.lineHeight}, calc((${v} * var(--provider-width) / 100 + ${r}px) * ${lineHeightRatio}), ${maxTypographyStyle.lineHeight})`,
        // we take before and after values from min config since they are always the same for any font size
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
