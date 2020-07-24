import { Theme } from "styled-system";

export const adsTheme: Theme = {
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
      darker: "#202021",
    },
    info: {
      main: "#CB4810",
      dark: "#8B2E05",
      darker: "#A03C12",
      darkest: "#2B2B2B",
    },
    success: {
      main: "#218358",
      light: "#30CF89",
      dark: "#0F4B30",
      darker: "#17211E",
      darkest: "#293835",
    },
    warning: {
      main: "#EABB0C",
      light: "#FFD32E",
      dark: "#886B00",
      darker: "#2C271A",
      darkest: "#2F2A1B",
    },
    danger: {
      main: "#E22C2C",
      light: "#FF4D4D",
      dark: "#830C0C",
      darker: "#2B1A1D",
      darkest: "#462F32",
    },
  },
  fonts: {
    main:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
  },
  space: [0, 3, 14, 7, 16, 11, 26, 10, 4, 26, 30, 36, 4, 6, 11],
  fontSizes: [0, 11, 12, 13],
  fontWeights: [0, 200, 300, 400, 500, 600, 700],
  lineHeights: [0, 13, 14, 15],
  letterSpacings: [0, 0.4, 0.6],
  radii: [0, 4],
};
