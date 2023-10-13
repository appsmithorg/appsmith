import { calculateScales } from "./calculateScales";

import type { ScaleConfig } from "./types";

const getFluidValue = (
  maxVw: number,
  minVw: number,
  sizing: ScaleConfig,
  sizingRatio = 1,
) => {
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
  maxVw: number,
  minVw: number,
  sizing: ScaleConfig,
  sizingRatio = 1,
  count = 100,
) => {
  const fluidValue = getFluidValue(maxVw, minVw, sizing, sizingRatio);

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
