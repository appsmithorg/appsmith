import { calculateScales } from "./calculateScales";

import type { ScaleConfig } from "./types";

const getFluidValue = (
  maxVw: number,
  minVw: number,
  sizing: ScaleConfig,
  userDensity = 1,
  userSizing = 1,
) => {
  const {
    maxV,
    minV,
    userDensityRatio = 1,
    userSizingRatio = 1,
    ...rest
  } = sizing;

  const ratio = userDensity * userDensityRatio + userSizing * userSizingRatio;

  const { maxSize, minSize, r, v } = calculateScales(
    {
      minV: minV * ratio,
      maxV: maxV * ratio,
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
  userDensity = 1,
  userSizing = 1,
  count = 200,
) => {
  const fluidValue = getFluidValue(
    maxVw,
    minVw,
    sizing,
    userDensity,
    userSizing,
  );

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
