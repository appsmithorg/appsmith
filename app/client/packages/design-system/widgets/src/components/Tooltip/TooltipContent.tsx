import React, { forwardRef } from "react";

import { Text } from "../Text";
import type {
  TooltipContentRef as HeadlessTooltipContentRef,
  TooltipContentProps as HeadlessTooltipContentProps,
} from "@design-system/headless";
import { StyledTooltipContent } from "./index.styled";

// (TODO) [Pawan] Move this constant to a common place
const PORTAL_ID = "wds-theme-provider";

export const TooltipContent = forwardRef(
  (props: HeadlessTooltipContentProps, ref: HeadlessTooltipContentRef) => {
    const { children, portalId = PORTAL_ID, ...rest } = props;

    return (
      <StyledTooltipContent portalId={portalId} ref={ref} {...rest}>
        {typeof children === "string" ? <Text>{children}</Text> : children}
      </StyledTooltipContent>
    );
  },
);
