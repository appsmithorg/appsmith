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

const DEFAULT_TOOLTIP_OFFSET = 10;
const DEFAULT_TOOLTIP_SHIFT = 5;
const DEFAULT_TOOLTIP_PADDING = 5;

export interface TooltipOptions {
  initialOpen?: boolean;
  placement?: Placement;
  open?: boolean;
  openDelay?: number;
  closeDelay?: number;
  onOpenChange?: (open: boolean) => void;
  offset?: number;
  shift?: number;
  padding?: number;
}

export function useTooltip({
  closeDelay = 0,
  initialOpen = false,
  onOpenChange: setControlledOpen,
  open: controlledOpen,
  openDelay = 0,
  placement = "top",
  offset: offsetProp = DEFAULT_TOOLTIP_OFFSET,
  shift: shiftProp = DEFAULT_TOOLTIP_SHIFT,
  padding: paddingProp = DEFAULT_TOOLTIP_PADDING,
}: TooltipOptions = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);

  const open = controlledOpen ?? uncontrolledOpen;
  const arrowRef = React.useRef<SVGSVGElement>(null);
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const data = useFloating({
    placement,
    open,
    strategy: "fixed",
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetProp),
      flip({
        fallbackAxisSideDirection: "start",
        padding: paddingProp,
      }),
      shift({ padding: shiftProp }),
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
