import React from "react";
import type { TooltipRootProps } from "@design-system/headless";

import { TooltipRoot, TooltipContent, TooltipTrigger } from "./";

export type TooltipProps = {
  tooltip?: React.ReactNode;
  children: React.ReactElement;
  placement?: TooltipRootProps["placement"];
};

export function Tooltip(props: TooltipProps) {
  const { children, tooltip, ...rest } = props;

  if (!tooltip) return children;

  return (
    <TooltipRoot {...rest}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </TooltipRoot>
  );
}
