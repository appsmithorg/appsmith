import { useEffect, useState } from "react";
import { calculateScales } from "./calculateScales";

import type { TokenObj, TokenScaleConfig } from "../../token";

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
  const [outerSpacing, setOuterSpacing] = useState<TokenObj>();
  const [innerSpacing, setInnerSpacing] = useState<TokenObj>();

  useEffect(() => {
    setOuterSpacing(getSpacing(outerSpacingConfig, userDensity, userSizing));
  }, [userDensity, userSizing, outerSpacingConfig]);

  useEffect(() => {
    setInnerSpacing(getSpacing(innerSpacingConfig, userDensity, userSizing));
  }, [userDensity, userSizing, innerSpacingConfig]);

  return {
    outerSpacing,
    innerSpacing,
  };
};
