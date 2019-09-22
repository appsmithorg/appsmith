// Color Names generated from http://chir.ag/projects/name-that-color
export const Colors: Record<string, string> = {
  WHITE: "#FFFFFF",
  POLAR: "#E9FAF3",
  GEYSER: "#D0D7DD",

  BLACK: "#000000",
  BLACK_PEARL: "#040627",
  SHARK: "#21282C",
  OUTER_SPACE: "#272E32",

  GREEN: "#29CCA3",
  RED: "#CE4257",
  PURPLE: "#6871EF",
};

export type Color = (typeof Colors)[keyof typeof Colors];
