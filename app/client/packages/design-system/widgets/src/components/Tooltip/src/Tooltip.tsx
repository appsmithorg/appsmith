import React from "react";
<<<<<<< HEAD
=======
import type { TooltipOptions } from "@design-system/headless";
>>>>>>> a2cb859cb3 (code review coments fixes)

import { TooltipRoot, TooltipContent, TooltipTrigger } from "./";

export type TooltipProps = {
  tooltip?: React.ReactNode;
  children: React.ReactElement;
<<<<<<< HEAD
};
=======
} & TooltipOptions;
>>>>>>> a2cb859cb3 (code review coments fixes)

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
