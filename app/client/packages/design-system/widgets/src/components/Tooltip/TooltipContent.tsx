import React, { forwardRef } from "react";

import { Text } from "../Text";
import type {
  TooltipContentRef as HeadlessTooltipContentRef,
  TooltipContentProps as HeadlessTooltipContentProps,
} from "@design-system/headless";
import { StyledTooltipContent } from "./index.styled";

// (TODO) [Pawan] Move this constant to a common place

export const TooltipContent = forwardRef(
  (props: HeadlessTooltipContentProps, ref: HeadlessTooltipContentRef) => {
    const { children, ...rest } = props;

    return (
      <StyledTooltipContent ref={ref} {...rest}>
        {typeof children === "string" ? <Text>{children}</Text> : children}
      </StyledTooltipContent>
    );
  },
);
