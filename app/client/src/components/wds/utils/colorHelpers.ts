import tinycolor from "tinycolor2";

/**
 * return "#fff" or "#000" based on the color passed
 * if the color is dark, it will return "#fff"
 * else it will return "#000"
 *
 * @param borderRadius
 * @returns
 */
export const getOnAccentColor = (color = "#fff") => {
  const tinyColor = tinycolor(color);
  const rgb: any = tinyColor.isValid()
    ? tinyColor.toRgb()
    : tinycolor("#fff").toRgb();

  const brightness = Math.round(
    (parseInt(rgb.r) * 299 + parseInt(rgb.g) * 587 + parseInt(rgb.b) * 114) /
      1000,
  );
  const textColor = brightness > 125 ? "black" : "white";

  return textColor;
};

/**
 * darken the color
 *
 * @param borderRadius
 * @returns
 */
export const getAccentHoverColor = (color = "#fff", amount = 10) => {
  const tinyColor = tinycolor(color);

  return tinyColor.isValid()
    ? tinyColor.darken(amount).toString()
    : tinycolor("#fff")
        .darken(amount)
        .toString();
};
