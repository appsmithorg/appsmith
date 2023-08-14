import type { FluidScale, Scale } from "./types";

export const calculateFluidScales = (scales: Scale[], screenWidth: number) => {
  const fluidScales: FluidScale[] = [];

  scales.forEach((scale) => {
    const { r, v } = scale;
    const fluid = (screenWidth / 100) * v + r;

    fluidScales.push({
      fluid,
    });
  });

  return fluidScales;
};
