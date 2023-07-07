import React from "react";

import { TooltipRoot, TooltipContent, TooltipTrigger } from "./";

export type TooltipProps = {
  tooltip?: React.ReactNode;
  children: React.ReactElement;
};

export function Tooltip(props: TooltipProps) {
  const { children, tooltip } = props;

  if (!tooltip) return children;

  return (
    <TooltipRoot>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </TooltipRoot>
  );
}
