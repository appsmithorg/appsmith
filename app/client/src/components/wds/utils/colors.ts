import Color from "colorjs.io";

/**
 * returns black or white based on the constrast of the color compare to white
 * using APCA algorithm
 *
 * @param color
 * @returns
 */
export const getComplementaryGrayscaleColor = (hex = "#000") => {
  const bg = parseColor(hex);
  const text = new Color("#fff");

  const contrast = bg.contrast(text, "APCA");

  // if contrast is less than -35 then the text color should be white
  if (contrast < -35) return "#fff";

  return "#000";
};

/**
 * lightens color
 *
 * @param color
 * @param amount
 * @returns
 */
export const lightenColor = (hex = "#000", lightness = 0.9) => {
  const color = parseColor(hex);

  color.set("oklch.l", () => lightness);

  return color.toString({ format: "hex" });
};

/**
 * darkens color by a given amount
 *
 * @param hex
 * @param lightness
 * @returns
 */
export const darkenColor = (hex = "#000", lightness = 0.03) => {
  const color = parseColor(hex);

  color.set("oklch.l", (l: any) => l - lightness);

  return color.toString({ format: "hex" });
};

/**
 * calculate the hover color
 *
 * @param hex
 * @returns
 */
export const calulateHoverColor = (hex = "#000") => {
  const color = parseColor(hex);

  switch (true) {
    case color.get("oklch.l") > 0.35:
      color.set("oklch.l", (l: any) => l + 0.03);
      break;
    case color.get("oklch.l") < 0.35:
      color.set("oklch.l", (l: any) => l - 0.03);
      break;
  }

  return color.toString({ format: "hex" });
};

/**
 * Parses a color and returns a color object
 * if the color is invalid it returns black
 *
 * @param hex
 * @returns
 */
export const parseColor = (hex = "#000") => {
  try {
    return new Color(hex);
  } catch (error) {
    return new Color("#000");
  }
};
