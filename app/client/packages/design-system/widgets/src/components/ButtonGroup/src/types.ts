import type React from "react";

export const ORIENTATION = {
  vertical: "vertical",
  horizontal: "horizontal",
} as const;

type Orientation = keyof typeof ORIENTATION;
export interface ButtonGroupProps
  extends React.ComponentPropsWithoutRef<"div"> {
  children?: React.ReactNode;
  orientation?: Orientation;
}
