import React, { forwardRef } from "react";
import { useThemeContext } from "@design-system/theming";

import type {
  TooltipContentRef as HeadlessTooltipContentRef,
  TooltipContentProps as HeadlessTooltipContentProps,
} from "@design-system/headless";
import { Text } from "../../Text";
import { StyledTooltipContent } from "./index.styled";

const BORDER_RADIUS_THRESHOLD = 6;

const _TooltipContent = (
  props: HeadlessTooltipContentProps,
  ref: HeadlessTooltipContentRef,
) => {
  const { children, ...rest } = props;

  // We have to shift the arrow so that there is no empty space if the tooltip has rounding
  const theme = useThemeContext();
  const borderRadius = Number(
    (theme?.borderRadius?.[1].value as string).replace("px", ""),
  );
  const isRounded = borderRadius > BORDER_RADIUS_THRESHOLD;

  return (
    <StyledTooltipContent $isRounded={isRounded} ref={ref} {...rest}>
      {typeof children === "string" ? <Text>{children}</Text> : children}
    </StyledTooltipContent>
  );
};

export const TooltipContent = forwardRef(_TooltipContent);
