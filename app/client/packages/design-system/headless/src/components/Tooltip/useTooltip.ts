import React from "react";
import {
  flip,
  shift,
  arrow,
  offset,
  useRole,
  useHover,
  useFocus,
  autoUpdate,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import type { Placement } from "@floating-ui/react";

const TOOLTIP_OFFSET = 8;

interface TooltipOptions {
  initialOpen?: boolean;
  placement?: Placement;
  open?: boolean;
  openDelay?: number;
  closeDelay?: number;
  onOpenChange?: (open: boolean) => void;
}

export function useTooltip({
  closeDelay = 0,
  initialOpen = false,
  onOpenChange: setControlledOpen,
  open: controlledOpen,
  openDelay = 0,
  placement = "top",
}: TooltipOptions = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);

  const open = controlledOpen ?? uncontrolledOpen;
  const arrowRef = React.useRef<SVGSVGElement>(null);
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const data = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(TOOLTIP_OFFSET),
      flip({
        fallbackAxisSideDirection: "start",
        padding: 5,
      }),
      shift({ padding: 5 }),
      arrow({
        element: arrowRef,
      }),
    ],
  });

  const context = data.context;

  const hover = useHover(context, {
    move: false,
    delay: {
      open: openDelay,
      close: closeDelay,
    },
    enabled: controlledOpen == null,
  });
  const focus = useFocus(context, {
    enabled: controlledOpen == null,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const interactions = useInteractions([hover, focus, dismiss, role]);

  return React.useMemo(
    () => ({
      open,
      setOpen,
      arrowRef,
      ...interactions,
      ...data,
    }),
    [open, setOpen, interactions, data, arrowRef],
  );
}
