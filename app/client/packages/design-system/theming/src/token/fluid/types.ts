export interface FluidConfig {
  minVw: number;
  maxVw: number;
  rootUnit: ScaleConfig;
  spacing: ScaleConfig;
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
}

export interface Scale {
  minSize: number;
  maxSize: number;
  v: number;
  r: number;
}

export interface FluidScale {
  fluid: number;
}
