import type { UseFloatingOptions } from "@floating-ui/react/src/types";
import { useState, useMemo } from "react";
import {
  autoUpdate,
  flip,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";

import type { PopoverProps } from "./types";

const DEFAULT_POPOVER_OFFSET = 10;

export function usePopover({
  defaultOpen = false,
  duration = 0,
  initialFocus,
  isOpen: controlledOpen,
  modal = false,
  offset: offsetProp = DEFAULT_POPOVER_OFFSET,
  onClose,
  placement = "bottom",
  setOpen: setControlledOpen,
  triggerRef,
}: PopoverProps = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [labelId, setLabelId] = useState<string | undefined>();
  const [descriptionId, setDescriptionId] = useState<string | undefined>();
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const config: Partial<UseFloatingOptions> = {
    placement,
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetProp),
      flip({
        crossAxis: placement.includes("-"),
        fallbackAxisSideDirection: "end",
      }),
    ],
  };

  const data = useFloating({
    open,
    onOpenChange: setOpen,
    ...(modal ? {} : config),
  });

  const context = data.context;
  const click = useClick(context, {
    enabled: controlledOpen == null,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context);
  const interactions = useInteractions([click, dismiss, role]);

  return useMemo(
    () => ({
      open,
      setOpen,
      ...interactions,
      ...data,
      modal,
      labelId,
      descriptionId,
      setLabelId,
      setDescriptionId,
      duration,
      triggerRef,
      initialFocus,
      onClose,
    }),
    [
      open,
      setOpen,
      interactions,
      data,
      modal,
      labelId,
      descriptionId,
      triggerRef,
      initialFocus,
      onClose,
    ],
  );
}
