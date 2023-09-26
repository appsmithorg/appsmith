import type React from "react";
import type { ButtonProps } from "../../Button";

export interface ButtonGroupProps
  extends Pick<ButtonProps, "variant" | "color"> {
  children?: React.ReactNode;
  orientation?: "vertical" | "horizontal";
}

export type ButtonGroupItemProps = Omit<ButtonProps, "variant" | "color">;
