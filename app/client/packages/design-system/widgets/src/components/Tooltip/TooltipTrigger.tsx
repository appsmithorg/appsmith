import * as React from "react";

import type {
  TooltipTriggerProps as HeadlessTooltipTriggerProps,
  TooltipTriggerRef as HeadlessTooltipTriggerRef,
} from "@design-system/headless";
import { StyledTooltipTrigger } from "./index.styled";

export const TooltipTrigger = React.forwardRef(function TooltipTrigger(
  props: HeadlessTooltipTriggerProps,
  propRef: HeadlessTooltipTriggerRef,
) {
  const { children } = props;

  return <StyledTooltipTrigger ref={propRef}>{children}</StyledTooltipTrigger>;
});
