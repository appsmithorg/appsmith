import { borderRadius } from "react-select/src/theme";
import { calculateScales } from "./calculateScales";
import type { ScaleConfig } from "./types";

export const getFluidRadii = (
  maxVw: number,
  minVw: number,
  borderRadius: ScaleConfig,
  userDensity = 1,
  userSizing = 1,
) => {
  const {
    maxV,
    minV,
    userDensityRatio = 1,
    userSizingRatio = 1,
    ...rest
  } = borderRadius;

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
