/* eslint-disable react/no-unused-prop-types */
import React, { forwardRef } from "react";

import { StyledContainer } from "./index.styled";

// types
export interface ButtonGroupProps
  extends React.ComponentPropsWithoutRef<"div"> {
  children?: React.ReactNode;
  orientation?: "vertical" | "horizontal";
}

// component
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (props, ref) => {
    const { orientation = "horizontal", ...others } = props;
    return <StyledContainer orientation={orientation} ref={ref} {...others} />;
  },
);

ButtonGroup.displayName = "ButtonGroup";
