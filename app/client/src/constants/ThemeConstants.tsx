import { invert } from "lodash";

/**
 * mapping of tailwind colors
 *
 * NOTE: these are used in colorpicker
 */
export type TailwindColors = {
  [key: string]: {
    [key: string]: string;
  };
};

export const TAILWIND_COLORS: TailwindColors = {
  gray: {
    100: "#f4f4f5",
    300: "#d4d4d8",
    500: "#71717a",
    700: "#3f3f46",
    900: "#18181b",
  },
  red: {
    100: "#fee2e2",
    300: "#fca5a5",
    500: "#ef4444",
    700: "#b91c1c",
    900: "#7f1d1d",
  },

  yellow: {
    100: "#fef9c3",
    300: "#fde047",
    500: "#eab308",
    700: "#a16207",
    900: "#713f12",
  },

  green: {
    100: "#dcfce7",
    300: "#86efac",
    500: "#22c55e",
    700: "#15803d",
    900: "#14532d",
  },
  blue: {
    100: "#dbeafe",
    300: "#93c5fd",
    500: "#3b82f6",
    700: "#1d4ed8",
    900: "#1e3a8a",
  },
  purple: {
    100: "#f3e8ff",
    300: "#d8b4fe",
    500: "#a855f7",
    700: "#7e22ce",
    900: "#581c87",
  },
  pink: {
    100: "#fce7f3",
    300: "#f9a8d4",
    500: "#ec4899",
    700: "#be185d",
    900: "#831843",
  },
};

export const bindingPrefix = "appsmith.theme";

export const getThemePropertyBinding = (property: string) =>
  `{{${bindingPrefix}.${property}}}`;

export const borderRadiusPropertyName = "borderRadius";

/**
 * border radius options to be shown in property pane
 */
export const borderRadiusOptions: Record<string, string> = {
  none: "0px",
  M: "0.375rem",
  L: "1.5rem",
};

export const invertedBorderRadiusOptions: Record<string, string> =
  invert(borderRadiusOptions);

export const boxShadowPropertyName = "boxShadow";

/**
 * box shadow options to be shown in property pane
 */
export const boxShadowOptions: Record<string, string> = {
  none: "none",
  S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
};

/**
 * box shadow size mapping for the size name to displayed in property pane
 */
export const sizeMappings: Record<string, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
};

export const invertedBoxShadowOptions: Record<string, string> =
  invert(boxShadowOptions);

export const colorsPropertyName = "colors";

// Text sizes in theming
export const THEMEING_TEXT_SIZES = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  md: "1.125rem",
  lg: "1.5rem",
  xl: "1.875rem",
  "2xl": "3rem",
  "3xl": "3.75rem",
};
// Text sizes type
export type ThemingTextSizes = keyof typeof THEMEING_TEXT_SIZES;

// Theming borderRadius:
export const THEMING_BORDER_RADIUS = {
  none: "0px",
  rounded: "0.375rem",
  circle: "9999px",
};

export const DEFAULT_BOXSHADOW = "none";
