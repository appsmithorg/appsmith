import type Color from "colorjs.io";
import { parse } from "./parse";
import type { ColorTypes } from "colorjs.io/types/src/color";

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
  return color.set("oklch.l", lightness);
};

const setChroma = (color: Color, chroma: number) => {
  return color.set("oklch.c", chroma);
};

const setHue = (color: Color, hue: number) => {
  return color.set("oklch.h", hue);
};
