import React from "react";
import type { ReactNode } from "react";

import { TooltipContext } from "./TooltipContext";
import { useTooltip } from "./useTooltip";
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
