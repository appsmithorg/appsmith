import React from "react";

import type { TooltipOptions } from "@appsmith/wds-headless";

import { TooltipContent, TooltipRoot, TooltipTrigger } from "./";

export type TooltipProps = {
  tooltip?: React.ReactNode;
  children: React.ReactElement;
} & TooltipOptions;

export function Tooltip(props: TooltipProps) {
  const { children, tooltip, ...rest } = props;

  if (!Boolean(tooltip)) return children;

  return (
    <TooltipRoot {...rest}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </TooltipRoot>
  );
}
