export interface FluidConfig {
  minVw: number;
  maxVw: number;
  sizing: ScaleConfig;
  outerSpacing: ScaleConfig;
  innerSpacing: ScaleConfig;
  typography: ScaleConfig;
}

export interface ScaleConfig {
  minV: number;
  maxV: number;
  minR: number;
  maxR: number;
  minN: number;
  maxN: number;
  stepsUp: number;
  stepsDown: number;
  userSizingRatio?: number;
  userDensityRatio?: number;
}

export interface Scale {
  minSize: number;
  maxSize: number;
  v: number;
  r: number;
}
