import React, { forwardRef } from "react";

import { Text } from "../Text";
import { StyledTooltipContent } from "./index.styled";

type TooltipContentRef = React.Ref<HTMLDivElement>;
type TooltipContentProps = React.HTMLAttributes<HTMLDivElement>;

const PORTAL_ID = "canvas";

export const TooltipContent = forwardRef(
  (props: TooltipContentProps, ref: TooltipContentRef) => {
    const { children, ...rest } = props;

    return (
      <StyledTooltipContent portalId={PORTAL_ID} ref={ref} {...rest}>
        {typeof children === "string" ? <Text>{children}</Text> : children}
      </StyledTooltipContent>
    );
  },
);
