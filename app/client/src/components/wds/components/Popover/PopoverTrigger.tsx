import * as React from "react";
import { useMergeRefs } from "@floating-ui/react";

import { Button } from "../Button";
import { usePopoverContext } from "./PopoveContext";

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const PopoverTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLProps<HTMLElement> & PopoverTriggerProps
>(function PopoverTrigger({ asChild = false, children, ...props }, propRef) {
  const context = usePopoverContext();
  const childrenRef = (children as any).ref;
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children,
      context.getReferenceProps({
        ref,
        ...props,
        ...children.props,
        "data-state": context.open ? "open" : "closed",
      }),
    );
  }

  return (
    <Button
      data-state={context.open ? "open" : "closed"}
      // The user can style the trigger based on the state
      ref={ref}
      {...context.getReferenceProps(props)}
    >
      {children}
    </Button>
  );
});
