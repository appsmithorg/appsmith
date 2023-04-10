import type Color from "colorjs.io";
import { parse } from "./parse";
import type { ColorTypes } from "colorjs.io/types/src/color";

// Ratio to replace chroma values from Figma(0-50) to colorjs(0-0.4)
const CHROMA_RATIO = 0.008;
// Ratio to replace lightness values from Figma(0-100) to colorjs(0-1)
const LIGHTNESS_RATIO = 0.01;

export const setLch = (
  color: ColorTypes,
  lch: {
    l?: number;
    c?: number;
    h?: number;
  },
) => {
  const { c, h, l } = lch;
  let currentColor = parse(color);

  if (l) {
    currentColor = setLightness(currentColor, l);
  }

  if (c) {
    currentColor = setChroma(currentColor, c);
  }

  if (h) {
    currentColor = setHue(currentColor, h);
  }

  return currentColor.toString({ format: "hex" });
};

const setLightness = (color: Color, lightness: number) => {
  return color.set("oklch.l", lightness * LIGHTNESS_RATIO);
};

const setChroma = (color: Color, chroma: number) => {
  return color.set("oklch.c", chroma * CHROMA_RATIO);
};

const setHue = (color: Color, hue: number) => {
  return color.set("oklch.h", hue);
};
