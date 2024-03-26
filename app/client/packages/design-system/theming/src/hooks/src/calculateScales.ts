import type { ScaleConfig } from "./types";

export const calculateScales = (scaleConfig: ScaleConfig): number[] => {
  const { N, R, stepsDown, stepsUp, V } = scaleConfig;

  const scales = [];

  for (let i = -stepsDown; i < stepsUp; i++) {
    scales.push(V * Math.pow(R, i / N));
  }

  return scales;
};
