import Color from "colorjs.io";
import type { ColorTypes } from "colorjs.io/types/src/color";

export const contrast = (color1: ColorTypes, color2: ColorTypes) => {
  return Color.contrast(color1, color2, "APCA");
};
