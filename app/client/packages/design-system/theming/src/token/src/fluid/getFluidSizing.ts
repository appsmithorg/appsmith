import { calculateScales } from "./calculateScales";

import type { FluidConfig } from "./types";

const getFluidValue = (scaleConfig: FluidConfig, sizingRatio = 1) => {
  const { maxVw, minVw, sizing } = scaleConfig;
  const { maxV, minV, ...rest } = sizing;
  const { maxSize, minSize, r, v } = calculateScales(
    {
      minV: minV * sizingRatio,
      maxV: maxV * sizingRatio,
      ...rest,
    },
    minVw,
    maxVw,
  )[0];

  return `clamp(${minSize}px, calc(${v}vw + ${r}px), ${maxSize}px)`;
};

export const getFluidSizing = (
  scaleConfig: FluidConfig,
  sizingRatio = 1,
  count = 100,
) => {
  const fluidValue = getFluidValue(scaleConfig, sizingRatio);

  return [...Array(count)].reduce(
    (acc, value, index) => {
      return {
        ...acc,
        [index + 1]: `calc(${index + 1} * ${fluidValue})`,
      };
    },
    {
      0: 0,
    },
  );
};
