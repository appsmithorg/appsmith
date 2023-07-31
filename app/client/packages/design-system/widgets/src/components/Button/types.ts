export const BUTTON_VARIANTS = {
  FILLED: "filled",
  OUTLINED: "outlined",
  GHOST: "ghost",
} as const;

export type ButtonVariant =
  (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS];

export const BUTTON_ICON_POSITIONS = {
  START: "start",
  END: "end",
} as const;

export type ButtonIconPosition =
  (typeof BUTTON_ICON_POSITIONS)[keyof typeof BUTTON_ICON_POSITIONS];

export const BUTTON_COLORS = {
  ACCENT: "accent",
  NEUTRAL: "neutral",
  POSITIVE: "positive",
  NEGATIVE: "negative",
  WARNING: "warning",
} as const;

export type ButtonColor = (typeof BUTTON_COLORS)[keyof typeof BUTTON_COLORS];
