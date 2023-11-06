import React, { useState } from "react";
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
  isOpen: controlledOpen,
  modal = true,
  offset: offsetProp = DEFAULT_POPOVER_OFFSET,
  placement = "bottom",
  setOpen: setControlledOpen,
}: PopoverProps = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [labelId, setLabelId] = useState<string | undefined>();
  const [descriptionId, setDescriptionId] = useState<string | undefined>();

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const data = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetProp),
      flip({
        crossAxis: placement.includes("-"),
        fallbackAxisSideDirection: "end",
      }),
    ],
  });

  const context = data.context;
  const click = useClick(context, {
    enabled: controlledOpen == null,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context);
  const interactions = useInteractions([click, dismiss, role]);

  return React.useMemo(
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
    }),
    [open, setOpen, interactions, data, modal, labelId, descriptionId],
  );
}
