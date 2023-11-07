import type React from "react";
import type { ButtonProps } from "../../Button";

export const BUTTON_GROUP_ORIENTATIONS = {
  vertical: "vertical",
  horizontal: "horizontal",
};

export interface InheritedButtonProps
  extends Pick<ButtonProps, "variant" | "color"> {}

export interface ButtonGroupProps extends InheritedButtonProps {
  children?: React.ReactNode;
  orientation?: keyof typeof BUTTON_GROUP_ORIENTATIONS;
}

export type ButtonGroupItemProps = Omit<ButtonProps, "variant" | "color">;
