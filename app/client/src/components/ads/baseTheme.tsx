import { Theme } from "styled-system";

export const adsTheme: Theme<0> = {
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
    primary: {
      main: "#CB4810",
      dark: "#B94310",
      darker: "#A03C12",
      darkest: "#2B2B2B",
      hover: "#2B2B2D",
    },
    success: {
      main: "#218358",
      dark: "#0F4B30",
      darker: "#115134",
      darkest: "#293835",
      hover: "#17211E",
    },
    warning: {
      main: "#E22C2C",
      dark: "#CD2A2A",
      darker: "#B12728",
      darkest: "#462F32",
      hover: "#2C271A",
    },
    danger: {
      main: "#E22C2C",
      dark: "#830C0C",
      darker: "#830C0C",
      darkest: "#462F32",
      hover: "#2B1A1D",
    },
  },
  fonts: {
    main:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
  },
  space: [0, 3, 14, 7, 16, 11, 26],
  fontSizes: [0, 11, 12, 13],
  fontWeights: [0, 200, 300, 400, 500, 700],
  lineHeights: [0, 13, 14, 15],
};

export const buttonCustomTheme = {
  ...adsTheme,
  buttonSizes: {
    small: {
      fontSize: 1,
      lineHeight: 1,
      px: 1,
      py: 2,
    },
    medium: {
      fontSize: 2,
      lineHeight: 2,
      px: 3,
      py: 4,
    },
    large: {
      fontSize: 3,
      lineHeight: 3,
      px: 5,
      py: 6,
    },
  },
};
