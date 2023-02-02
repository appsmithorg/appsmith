import * as React from "react";
import { Placement } from "@floating-ui/react";
import { usePopover } from "./usePopover";
import { PopoverContext, usePopoverContext } from "./PopoveContext";

interface PopoverOptions {
  initialOpen?: boolean;
  placement?: Placement;
  modal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({
  children,
  modal = false,
  ...restOptions
}: {
  children: React.ReactNode;
} & PopoverOptions) {
  // This can accept any props as options, e.g. `placement`,
  // or other positioning options.
  const popover = usePopover({ modal, ...restOptions });
  return (
    <PopoverContext.Provider value={popover}>
      {children}
    </PopoverContext.Provider>
  );
}

export const PopoverClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function PopoverClose({ children, ...props }, ref) {
  const { setOpen } = usePopoverContext();
  return (
    <button type="button" {...props} onClick={() => setOpen(false)} ref={ref}>
      {children}
    </button>
  );
});
