import type { TokenScaleConfig } from "../../token";

export const calculateScales = (scaleConfig: TokenScaleConfig): number[] => {
  const { N, R, stepsDown, stepsUp, V } = scaleConfig;

  const scales = [];

  for (let i = -stepsDown; i < stepsUp; i++) {
    scales.push(V * Math.pow(R, i / N));
  }

  return scales;
};
