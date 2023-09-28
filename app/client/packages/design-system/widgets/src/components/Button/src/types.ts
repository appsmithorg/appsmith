import type { ButtonProps as HeadlessButtonProps } from "@design-system/headless";
import type React from "react";
import type { COLORS } from "../../../shared";

export const BUTTON_VARIANTS = {
  filled: "filled",
  outlined: "outlined",
  ghost: "ghost",
} as const;

export const BUTTON_ICON_POSITIONS = {
  start: "start",
  end: "end",
} as const;

export interface ButtonProps extends HeadlessButtonProps {
  /** variant of the button
   * @default filled
   */
  variant?: keyof typeof BUTTON_VARIANTS;
  /** Color tone of the button
   * @default accent
   */
  color?: keyof typeof COLORS;
  /** Indicates the loading state of the button */
  isLoading?: boolean;
  /** Icon to be used in the button of the button */
  icon?: React.ComponentType;
  /** Indicates the position of icon of the button
   * @default accent
   */
  iconPosition?: keyof typeof BUTTON_ICON_POSITIONS;
  /** Makes the button visually and functionaly disabled but focusable */
  visuallyDisabled?: boolean;
  /** Indicates the loading text that will be used by screen readers
   * when the button is in loading state
   * @default Loading...
   */
  loadingText?: string;
}
