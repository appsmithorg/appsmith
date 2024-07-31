import type { IconProps } from "../Icon";
import type React from "react";
import type { Sizes } from "../__config__/types";

export type SpinnerSizes = Extract<Sizes, "sm" | "md" | "lg">;

// Spinner props
export type SpinnerProps = {
  /** Spinner size */
  size?: SpinnerSizes;
  /** Spinner icon props */
  iconProps?: Omit<IconProps, "name">;
} & React.HTMLAttributes<HTMLSpanElement>;
