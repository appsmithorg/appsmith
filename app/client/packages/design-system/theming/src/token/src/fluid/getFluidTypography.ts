import type { FluidConfig } from "./types";
import { calculateScales } from "./calculateScales";
import type { Typography } from "../../../typography";
import { TypographyVariant } from "../../../typography";
import { calculateFluidScales } from "./calculateFluidScales";

export const getFluidTypography = (
  scaleConfig: FluidConfig,
  rootUnitRatio: number,
  vw: number,
) => {
  const { maxVw, minVw, typography } = scaleConfig;
  const { maxV, minV, ...rest } = typography;
  const scales = calculateFluidScales(
    calculateScales(
      {
        minV: minV * rootUnitRatio,
        maxV: maxV * rootUnitRatio,
        ...rest,
      },
      minVw,
      maxVw,
    ),
    vw,
  );

  return Object.keys(TypographyVariant).reduce((prev, current, index) => {
    return {
      ...prev,
      [current]: {
        capHeight: scales[index].fluid,
        lineGap: scales[index].fluid,
      },
    };
  }, {} as Typography);
};
