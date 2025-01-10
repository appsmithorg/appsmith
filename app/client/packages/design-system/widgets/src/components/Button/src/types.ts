import type { ButtonProps as HeadlessButtonProps } from "react-aria-components";

import type { IconProps } from "../../Icon";
import type { COLORS, SIZES } from "../../../shared";

export const BUTTON_VARIANTS = {
  filled: "Filled",
  outlined: "Outlined",
  subtle: "Subtle",
  ghost: "Ghost",
} as const;

export const BUTTON_ICON_POSITIONS = {
  start: "Start",
  end: "End",
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
  icon?: IconProps["name"];
  /** Indicates the position of icon of the button
   * @default accent
   */
  iconPosition?: keyof typeof BUTTON_ICON_POSITIONS;
  /** Indicates the loading text that will be used by screen readers
   * when the button is in loading state
   * @default Loading...
   */
  loadingText?: string;
  /** Size of the button
   * @default medium
   */
  size?: Omit<keyof typeof SIZES, "large">;
  /** Indicates if the button should be disabled when the form is invalid */
  disableOnInvalidForm?: boolean;
  /** Indicates if the button should reset the form when clicked */
  resetFormOnClick?: boolean;
}
