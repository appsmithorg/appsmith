import React, { forwardRef } from "react";

import type {
  TooltipTriggerProps as HeadlessTooltipTriggerProps,
  TooltipTriggerRef as HeadlessTooltipTriggerRef,
} from "@appsmith/wds-headless";
import { TooltipTrigger as HeadlessTooltipTrigger } from "@appsmith/wds-headless";

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
