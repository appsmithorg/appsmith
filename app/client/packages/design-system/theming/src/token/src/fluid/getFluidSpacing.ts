import { calculateScales } from "./calculateScales";
import type { ScaleConfig } from "./types";

export const getFluidSpacing = (
  maxVw: number,
  minVw: number,
  spacing: ScaleConfig,
  densityRatio = 1,
) => {
  const { maxV, minV, ...rest } = spacing;

  const scales = calculateScales(
    {
      minV: minV * densityRatio,
      maxV: maxV * densityRatio,
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
