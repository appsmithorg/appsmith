import React from "react";
import type { ReactNode } from "react";
import type { Placement } from "@floating-ui/react";

import { useTooltip } from "./useTooltip";
import { TooltipContext } from "./TooltipContext";

interface TooltipOptions {
  initialOpen?: boolean;
  placement?: Placement;
  open?: boolean;
  openDelay?: number;
  closeDelay?: number;
  onOpenChange?: (open: boolean) => void;
}

type TooltipProps = { children: ReactNode } & TooltipOptions;

export function Tooltip({ children, ...options }: TooltipProps) {
  const tooltip = useTooltip(options);

  return (
    <TooltipContext.Provider value={tooltip}>
      {children}
    </TooltipContext.Provider>
  );
}
