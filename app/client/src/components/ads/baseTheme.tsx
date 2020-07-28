// import { Theme } from 'styled-system';

const mainFont =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

type colorCategories = {
  main: string;
  light: string;
  dark: string;
  darker: string;
  darkest: string;
};

type Colors = {
  blackShades: string[];
  tertiary: colorCategories;
  info: colorCategories;
  success: colorCategories;
  warning: colorCategories;
  danger: colorCategories;
};

export type AdSTheme = {
  colors: Colors;
  fonts: {
    main: typeof mainFont;
  };
  space: number[];
  fontSizes: number[];
  fontWeights: number[];
  lineHeights: number[];
  letterSpacings: number[];
  radii: number[];
};

export const adsTheme: AdSTheme = {
  colors: {
    blackShades: [
      "#090707",
      "#1A191C",
      "#232324",
      "#2B2B2B",
      "#404040",
      "#6D6D6D",
      "#9F9F9F",
      "#D4D4D4",
      "#E9E9E9",
      "#FFFFFF",
    ],
    tertiary: {
      main: "#D4D4D4",
      light: "#FFFFFF",
      dark: "#2B2B2B",
      darker: "#2B2B2B",
      darkest: "#202021",
    },
    info: {
      main: "#CB4810",
      light: "#F86A2B",
      dark: "#8B2E05",
      darker: "#47332b",
      darkest: "#2D231F",
    },
    success: {
      main: "#218358",
      light: "#30CF89",
      dark: "#0F4B30",
      darker: "#203C32",
      darkest: "#202B29",
    },
    warning: {
      main: "#EABB0C",
      light: "#FFD32E",
      dark: "#886B00",
      darker: "#3A3215",
      darkest: "#232017",
    },
    danger: {
      main: "#E22C2C",
      light: "#FF4D4D",
      dark: "#830C0C",
      darker: "#4A2526",
      darkest: "#322426",
    },
  },
  fonts: {
    main: mainFont,
  },
  space: [0, 3, 14, 7, 16, 11, 26, 10, 5, 26, 30, 36, 4, 6, 11, 25, 2],
  fontSizes: [0, 11, 12, 13],
  fontWeights: [0, 200, 300, 400, 500, 600, 700],
  lineHeights: [0, 13, 14, 15],
  letterSpacings: [0, 0.4, 0.6],
  radii: [0, 4],
};
