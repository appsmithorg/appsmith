import Color from "colorjs.io";

/**
 * checks if color is dark or light
 *
 * @param color
 * @returns
 */
export const getComplementaryGrayscaleColor = (hex = "#000") => {
  const bg = parseColor(hex);
  const text = new Color("#fff");

  const constrast = bg.contrast(text, "APCA");

  // if constrast is less than -25 then the text color should be white
  if (constrast < -35) return "#fff";

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
 * calculate the hover color
 *
 * @param hex
 * @returns
 */
export const calulateHoverColor = (hex = "#000") => {
  const color = parseColor(hex);

  switch (true) {
    case color.get("oklch.l") > 0.35:
      color.set("oklch.l", (l) => l - 0.03);
      break;
    case color.get("oklch.l") < 0.35:
      color.set("oklch.l", (l) => l + 0.03);
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
export const parseColor = (hex: string) => {
  try {
    return new Color(hex);
  } catch (error) {
    return new Color("#000");
  }
};
