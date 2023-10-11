import type { Scale, ScaleConfig } from "./types";

export const calculateScales = (
  scaleConfig: ScaleConfig,
  minVw: number,
  maxVw: number,
): Scale[] => {
  const { maxN, maxR, maxV, minN, minR, minV, stepsDown, stepsUp } =
    scaleConfig;

  const scales = [];

  for (let i = -stepsDown; i < stepsUp; i++) {
    const minSize = minV * Math.pow(minR, i / minN);
    const maxSize = maxV * Math.pow(maxR, i / maxN);
    const v = (100 * (maxSize - minSize)) / (maxVw - minVw);
    const r = (minVw * maxSize - maxVw * minSize) / (minVw - maxVw);

    scales.push({
      minSize: Number(minSize.toFixed(2)),
      maxSize: Number(maxSize.toFixed(2)),
      v: Number(v.toFixed(2)),
      r: Number(r.toFixed(2)),
    });
  }

  return scales;
};
