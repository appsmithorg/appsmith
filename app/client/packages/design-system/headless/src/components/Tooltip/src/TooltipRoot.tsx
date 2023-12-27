import React from "react";
import type { ReactNode } from "react";

import { useTooltip } from "./useTooltip";
import { TooltipContext } from "./TooltipContext";
import type { TooltipOptions } from "./useTooltip";

export type TooltipRootProps = { children: ReactNode } & TooltipOptions;

export function TooltipRoot({ children, ...options }: TooltipRootProps) {
  const tooltip = useTooltip(options);

  return (
    <TooltipContext.Provider value={tooltip}>
      {children}
    </TooltipContext.Provider>
  );
}
