import { parse } from "./parse";
import type { ColorTypes } from "colorjs.io/types/src/color";

export const lighten = (color: ColorTypes, lightness: number) => {
  return parse(color)
    .set("oklch.l", (l) => l * lightness)
    .toString({ format: "hex" });
};
