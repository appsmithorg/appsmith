import { calculateScales } from "./calculateScales";

import type { FluidConfig } from "./types";

export const getFluidRootUnit = (
  scaleConfig: FluidConfig,
  rootUnitRatio = 1,
) => {
  const { maxVw, minVw, rootUnit } = scaleConfig;
  const { maxV, minV, ...rest } = rootUnit;
  const { maxSize, minSize, r, v } = calculateScales(
    {
      minV: minV * rootUnitRatio,
      maxV: maxV * rootUnitRatio,
      ...rest,
    },
    minVw,
    maxVw,
  )[0];

  return `clamp(${minSize}px, calc(${v}vw + ${r}px), ${maxSize}px)`;
};
