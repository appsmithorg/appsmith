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
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },

  yellow: {
    50: "#fefce8",
    100: "#fef9c3",
    200: "#fef08a",
    300: "#fde047",
    400: "#facc15",
    500: "#eab308",
    600: "#ca8a04",
    700: "#a16207",
    800: "#854d0e",
    900: "#713f12",
  },

  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  indigo: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
  },
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
  },
  pink: {
    50: "#fdf2f8",
    100: "#fce7f3",
    200: "#fbcfe8",
    300: "#f9a8d4",
    400: "#f472b6",
    500: "#ec4899",
    600: "#db2777",
    700: "#be185d",
    800: "#9d174d",
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
