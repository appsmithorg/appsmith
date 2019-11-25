// Color Names generated from http://chir.ag/projects/name-that-color
export const Colors: Record<string, string> = {
  WHITE: "#FFFFFF",
  POLAR: "#E9FAF3",
  GEYSER: "#D3DEE3",
  GEYSER_LIGHT: "#D0D7DD",
  ATHENS_GRAY: "#EBEFF2",
  CONCRETE: "#F3F3F3",
  MYSTIC: "#E1E8ED",
  AQUA_HAZE: "#EEF2F5",
  GRAY_CHATEAU: "#A2A6A8",
  SUNGLOW: "#FFCB33",

  BLACK: "#000000",
  BLACK_PEARL: "#040627",
  SHARK: "#21282C",
  DEEP_SPACE: "#272E32",
  OUTER_SPACE: "#363E44",
  SLATE_GRAY: "#768896",
  PORCELAIN: "#EBEEF0",
  HIT_GRAY: "#A1ACB3",
  JUNGLE_MIST: "#BCCCD9",
  MERCURY: "#E8E8E8",
  MAKO: "#464D53",

  GREEN: "#29CCA3",
  JUNGLE_GREEN: "#24BA91",
  JUNGLE_GREEN_DARKER: "#30A481",
  RED: "#CE4257",
  PURPLE: "#6871EF",
  OXFORD_BLUE: "#2E3D49",
  FRENCH_PASS: "#BBE8FE",
  CADET_BLUE: "#A3B3BF",
};

export type Color = typeof Colors[keyof typeof Colors];
