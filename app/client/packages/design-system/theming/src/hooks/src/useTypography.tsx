import { useMemo } from "react";
import { calculateScales } from "./calculateScales";
import { createStyleObject } from "@capsizecss/core";
import appleSystem from "@capsizecss/metrics/appleSystem";

import type {
  Typography,
  TypographyVariantMetric,
  TokenScaleConfig,
} from "../../token";
import { TYPOGRAPHY_VARIANTS } from "../../token/src/types";
import { objectKeys } from "@appsmith/utils";

export const getTypography = (
  typography: TokenScaleConfig,
  userDensity = 1,
  userSizing = 1,
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
        fontMetrics: appleSystem,
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

  return objectKeys(TYPOGRAPHY_VARIANTS).reduce((prev, current, index) => {
    return {
      ...prev,
      [current]: styles[index],
    };
  }, {} as Typography);
};

export const useTypography = (
  config: TokenScaleConfig,
  userDensity = 1,
  userSizing = 1,
) => {
  const typography = useMemo(() => {
    return getTypography(config, userDensity, userSizing);
  }, [config, userDensity, userSizing]);

  return {
    typography,
  };
};
