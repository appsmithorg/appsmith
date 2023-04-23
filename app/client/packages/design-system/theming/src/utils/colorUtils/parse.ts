import Color from "colorjs.io";
import type { ColorTypes } from "colorjs.io/types/src/color";

export const parse = (color: ColorTypes) => {
  return new Color(color);
};
