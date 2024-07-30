export const typography = {
  h1: {
    fontSize: 20,
    lineHeight: 27,
    letterSpacing: -0.204,
    fontWeight: "var(--ads-font-weight-bold)",
  },
  h2: {
    fontSize: 18,
    lineHeight: 25,
    letterSpacing: -0.204,
    fontWeight: "var(--ads-font-weight-bold)",
  },
  h3: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.204,
    fontWeight: "var(--ads-font-weight-bold)",
  },
  h4: {
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.24,
    fontWeight: "var(--ads-font-weight-bold)",
  },
  h5: {
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.24,
    fontWeight: "var(--ads-font-weight-bold)",
  },
  h6: {
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.8,
    fontWeight: "var(--ads-font-weight-bold)",
  },
  p0: {
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.24,
    fontWeight: "var(--ads-font-weight-bold)",
  },
  p1: {
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.24,
    fontWeight: "normal",
  },
  p2: {
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: -0.24,
    fontWeight: "normal",
  },
  p3: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.221538,
    fontWeight: "normal",
  },
  p4: {
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: -0.221538,
    fontWeight: "var(--ads-font-weight-bold-xl)",
  },
  btnLarge: {
    fontSize: 13,
    lineHeight: 15,
    letterSpacing: 0.6,
    fontWeight: "var(--ads-font-weight-bold-xl)",
  },
  btnMedium: {
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.6,
    fontWeight: "var(--ads-font-weight-bold-xl)",
  },
  btnSmall: {
    fontSize: 11,
    lineHeight: 12,
    letterSpacing: 0.4,
    fontWeight: "var(--ads-font-weight-bold-xl)",
  },
  floatingBtn: {
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: -0.24,
    fontWeight: "normal",
  },
  releaseList: {
    fontSize: 14,
    lineHeight: 23,
    letterSpacing: -0.24,
    fontWeight: "normal",
  },
  cardHeader: {
    fontStyle: "normal",
    fontWeight: "var(--ads-font-weight-bold-xl)",
    fontSize: 25,
    lineHeight: 20,
    letterSpacing: "normal",
  },
  cardSubheader: {
    fontStyle: "normal",
    fontWeight: "normal",
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: "normal",
  },
  largeH1: {
    fontStyle: "normal",
    fontWeight: "bold",
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: "normal",
  },
  docHeader: {
    fontStyle: "normal",
    fontWeight: "bold",
    fontSize: 17,
    lineHeight: "normal",
    letterSpacing: "normal",
  },
  spacedOutP1: {
    fontStyle: "normal",
    fontWeight: "normal",
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: "normal",
  },
  categoryBtn: {
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.2,
    fontWeight: "var(--ads-font-weight-bold)",
  },
  sideHeading: {
    fontStyle: "normal",
    fontWeight: "bold",
    fontSize: 13,
    lineHeight: "normal",
    letterSpacing: "normal",
  },
  u1: {
    fontStyle: "normal",
    fontWeight: "var(--ads-font-weight-bold-xl)",
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: "normal",
  },
  u2: {
    fontSize: 10,
    fontStyle: "normal",
    fontWeight: "var(--ads-font-weight-bold-xl)",
    lineHeight: 12,
    letterSpacing: "normal",
  },
  dangerHeading: {
    fontStyle: "normal",
    fontWeight: "var(--ads-font-weight-bold)",
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.24,
  },
};

export type TypographyKeys = keyof typeof typography;
export type Typography = typeof typography;

export enum FontStyleTypes {
  BOLD = "BOLD",
  ITALIC = "ITALIC",
  REGULAR = "REGULAR",
  UNDERLINE = "UNDERLINE",
}

export const TextFonts =
  "PTRootUI, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue";

export const getTypographyByKey = (key: TypographyKeys) => `
  font-weight: ${typography[key].fontWeight};
  font-size: ${typography[key].fontSize}px;
  line-height: ${typography[key].lineHeight}px;
  letter-spacing: ${typography[key].letterSpacing}px;
`;
