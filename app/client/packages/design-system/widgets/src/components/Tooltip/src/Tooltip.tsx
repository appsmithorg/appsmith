import React from "react";
import {
  TooltipRoot as HeadlessTooltip,
  TooltipTrigger as HeadlessTooltipTrigger,
} from "@appsmith/wds-headless";
import type { TooltipOptions } from "@appsmith/wds-headless";

import { TooltipContent } from "./TooltipContent";

export type TooltipProps = {
  tooltip?: React.ReactNode;
  children: React.ReactElement;
} & TooltipOptions;

export function Tooltip(props: TooltipProps) {
  const { children, tooltip, ...rest } = props;

  if (!Boolean(tooltip)) return children;

  return (
    <HeadlessTooltip {...rest}>
      <HeadlessTooltipTrigger>{children}</HeadlessTooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </HeadlessTooltip>
  );
}
