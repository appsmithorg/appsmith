import type { ScaleConfig } from "./types";
import { calculateScales } from "./calculateScales";
import type { Typography } from "../../../typography";
import { TYPOGRAPHY_VARIANTS } from "../../../typography";
import { calculateFluidScales } from "./calculateFluidScales";

export const getFluidTypography = (
  maxVw: number,
  minVw: number,
  typography: ScaleConfig,
  userDensity = 1,
  userSizing = 1,
  vw: number,
) => {
  const {
    maxV,
    minV,
    userDensityRatio = 1,
    userSizingRatio = 1,
    ...rest
  } = typography;

  const ratio = userDensity * userDensityRatio + userSizing * userSizingRatio;

  const scales = calculateFluidScales(
    calculateScales(
      {
        minV: minV * ratio,
        maxV: maxV * ratio,
        ...rest,
      },
      minVw,
      maxVw,
    ),
    vw,
  );

  return Object.keys(TYPOGRAPHY_VARIANTS).reduce((prev, current, index) => {
    return {
      ...prev,
      [current]: {
        capHeight: scales[index].fluid,
        lineGap: scales[index].fluid,
      },
    };
  }, {} as Typography);
};
