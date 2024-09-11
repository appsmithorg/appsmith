import tinycolor from "tinycolor2";

function validateHex(arg: string) {
  // Test if the argument is a valid hex code. Passes both 3 letter and 6 letter hexes.
  const regex = new RegExp("/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i");

  if (regex.test(arg)) return arg;
  else {
    const cssVariable = arg.substring(4, arg.length - 1);
    return getComputedStyle(document.documentElement).getPropertyValue(
      cssVariable,
    );
  }
}

export const hexToRgb = (
  hex: string,
): {
  r: number;
  g: number;
  b: number;
} => {
  const validatedHex = validateHex(hex);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(validatedHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : {
        r: -1,
        g: -1,
        b: -1,
      };
};
export const hexToRgba = (color: string, alpha: number) => {
  const value = hexToRgb(color);
  return `rgba(${value.r}, ${value.g}, ${value.b}, ${alpha});`;
};
export const lighten = (color: string, amount: number) => {
  return tinycolor(color).lighten(amount).toString();
};
export const darken = (color: string, amount: number) => {
  return tinycolor(color).darken(amount).toString();
};
