import type React from "react";

type Orientation = "vertical" | "horizontal";

export interface ButtonGroupProps
  extends React.ComponentPropsWithoutRef<"div"> {
  children?: React.ReactNode;
  orientation?: Orientation;
}
