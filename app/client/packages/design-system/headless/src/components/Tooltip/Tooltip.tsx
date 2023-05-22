import React from "react";
import type { ReactNode } from "react";

import { useTooltip } from "./useTooltip";
import { TooltipContext } from "./TooltipContext";
import type { TooltipOptions } from "./useTooltip";

type TooltipProps = { children: ReactNode } & TooltipOptions;

export function Tooltip({ children, ...options }: TooltipProps) {
  const tooltip = useTooltip(options);

  return (
    <TooltipContext.Provider value={tooltip}>
      {children}
    </TooltipContext.Provider>
  );
}
