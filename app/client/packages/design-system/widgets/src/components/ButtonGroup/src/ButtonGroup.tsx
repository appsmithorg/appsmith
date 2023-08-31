import React, { forwardRef } from "react";

import { StyledContainer } from "./index.styled";

// types
export const ORIENTATION = {
  VERTICAL: "vertical",
  HORIZONTAL: "horizontal",
} as const;

type Orientation = (typeof ORIENTATION)[keyof typeof ORIENTATION];
export interface ButtonGroupProps
  extends React.ComponentPropsWithoutRef<"div"> {
  children?: React.ReactNode;
  orientation?: Orientation;
}

// component
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (props, ref) => {
    const { orientation = ORIENTATION.HORIZONTAL, ...others } = props;

    return (
      <StyledContainer
        data-orientation={
          orientation === ORIENTATION.VERTICAL ? "vertical" : undefined
        }
        ref={ref}
        {...others}
      />
    );
  },
);

ButtonGroup.displayName = "ButtonGroup";
