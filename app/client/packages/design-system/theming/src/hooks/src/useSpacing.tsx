import { useMemo } from "react";
import { calculateScales } from "./calculateScales";

import type { TokenScaleConfig } from "../../token";

export const getSpacing = (
  spacing: TokenScaleConfig,
  userDensity = 1,
  userSizing = 1,
) => {
  const { userDensityRatio = 1, userSizingRatio = 1, V, ...rest } = spacing;
  const ratio = userDensity * userDensityRatio + userSizing * userSizingRatio;
  const scales = calculateScales({
    V: V * ratio,
    ...rest,
  });

  return scales.reduce(
    (acc, currentValue, index) => {
      const value = `${currentValue.toFixed(1)}px`;

      return {
        ...acc,
        [index + 1]: value,
      };
    },
    {
      0: 0,
    },
  );
};

export const useSpacing = (
  outerSpacingConfig: TokenScaleConfig,
  innerSpacingConfig: TokenScaleConfig,
  userDensity = 1,
  userSizing = 1,
) => {
  const outerSpacing = useMemo(() => {
    return getSpacing(outerSpacingConfig, userDensity, userSizing);
  }, [outerSpacingConfig, userDensity, userSizing]);

  const innerSpacing = useMemo(() => {
    return getSpacing(innerSpacingConfig, userDensity, userSizing);
  }, [innerSpacingConfig, userDensity, userSizing]);

  return {
    outerSpacing,
    innerSpacing,
  };
};
