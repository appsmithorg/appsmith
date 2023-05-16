import * as React from "react";

import type {
  TooltipTriggerProps as HeadlessTooltipTriggerProps,
  TooltipTriggerRef as HeadlessTooltipTriggerRef,
} from "@design-system/headless";
import { Button } from "../Button";
import { StyledTooltipTrigger } from "./index.styled";

export const TooltipTrigger = React.forwardRef(function TooltipTrigger(
  props: HeadlessTooltipTriggerProps,
  propRef: HeadlessTooltipTriggerRef,
) {
  const { asChild, children, ...rest } = props;

  if (asChild && React.isValidElement(children)) {
    return (
      <StyledTooltipTrigger asChild ref={propRef}>
        {children}
      </StyledTooltipTrigger>
    );
  }

  // if asChild is not passed, use the WDS button as the trigger
  return (
    <StyledTooltipTrigger asChild>
      {/** @ts-expect-error Types conflict */}
      <Button ref={propRef} {...rest}>
        {children}
      </Button>
    </StyledTooltipTrigger>
  );
});
