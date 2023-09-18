import React, { forwardRef } from "react";

import type {
  TooltipTriggerRef as HeadlessTooltipTriggerRef,
  TooltipTriggerProps as HeadlessTooltipTriggerProps,
} from "@design-system/headless";
import { TooltipTrigger as HeadlessTooltipTrigger } from "@design-system/headless";

export const _TooltipTrigger = function TooltipTrigger(
  props: HeadlessTooltipTriggerProps,
  propRef: HeadlessTooltipTriggerRef,
) {
  const { children } = props;

  return (
    <HeadlessTooltipTrigger ref={propRef}>{children}</HeadlessTooltipTrigger>
  );
};

export const TooltipTrigger = forwardRef(_TooltipTrigger);
