import { useEffect, useState } from "react";
import { calculateScales } from "./calculateScales";

import type { TokenObj } from "../../token";
import type { FluidConfig } from "./types";
import type { ScaleConfig } from "./types";

export const getFluidSpacing = (
  maxVw: number,
  minVw: number,
  spacing: ScaleConfig,
  userDensity = 1,
  userSizing = 1,
) => {
  const {
    maxV,
    minV,
    userDensityRatio = 1,
    userSizingRatio = 1,
    ...rest
  } = spacing;

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

  return scales.reduce(
    (acc, currentValue, index) => {
      const { maxSize, minSize, r, v } = currentValue;
      const value = `clamp(${minSize}px, calc(${v} * var(--provider-width) / 100 + ${r}px), ${maxSize}px)`;

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

export const useFluidSpacing = (
  fluidConfig: FluidConfig,
  userDensity = 1,
  userSizing = 1,
) => {
  const {
    innerSpacing: innerSpacingConfig,
    maxVw,
    minVw,
    outerSpacing: outerSpacingConfig,
  } = fluidConfig;
  const [outerSpacing, setOuterSpacing] = useState<TokenObj>();
  const [innerSpacing, setInnerSpacing] = useState<TokenObj>();

  useEffect(() => {
    setOuterSpacing(
      getFluidSpacing(
        maxVw,
        minVw,
        outerSpacingConfig,
        userDensity,
        userSizing,
      ),
    );
  }, [userDensity, userSizing, maxVw, minVw, outerSpacingConfig]);

  useEffect(() => {
    setInnerSpacing(
      getFluidSpacing(
        maxVw,
        minVw,
        innerSpacingConfig,
        userDensity,
        userSizing,
      ),
    );
  }, [userDensity, userSizing, maxVw, minVw, innerSpacingConfig]);

  return {
    outerSpacing,
    innerSpacing,
  };
};
