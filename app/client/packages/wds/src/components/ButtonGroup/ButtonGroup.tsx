import React, { forwardRef } from "react";

import { StyledContainer } from "./index.styled";

// types
export enum Orientation {
  VERTICAL = "vertical",
  HORIZONTAL = "horizontal",
}

export interface ButtonGroupProps
  extends React.ComponentPropsWithoutRef<"div"> {
  children?: React.ReactNode;
  orientation?: Orientation;
}

// component
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (props, ref) => {
    const { orientation = Orientation.HORIZONTAL, ...others } = props;
    return <StyledContainer orientation={orientation} ref={ref} {...others} />;
  },
);

ButtonGroup.displayName = "ButtonGroup";
