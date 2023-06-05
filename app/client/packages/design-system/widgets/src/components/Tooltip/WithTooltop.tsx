import React from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "./";

export type WithTooltipProps = {
  tooltip?: string;
  children: React.ReactElement;
};

export type TooltipProps = WithTooltipProps;

export function WithTooltip(props: TooltipProps) {
  const { children, tooltip } = props;

  if (!tooltip) return children;

  return (
    <Tooltip>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
