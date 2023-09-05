import { calculateScales } from "./calculateScales";
import type { FluidConfig } from "./types";

export const getFluidSpacing = (
  scaleConfig: FluidConfig,
  rootUnitRatio: number,
) => {
  const { maxVw, minVw, spacing } = scaleConfig;
  const { maxV, minV, ...rest } = spacing;

  const scales = calculateScales(
    {
      minV: minV * rootUnitRatio,
      maxV: maxV * rootUnitRatio,
      ...rest,
    },
    minVw,
    maxVw,
  );

  return scales.reduce(
    (acc, currentValue, index) => {
      const { maxSize, minSize, r, v } = currentValue;
      const value = `clamp(${minSize}px, calc(${v}vw + ${r}px), ${maxSize}px)`;

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
