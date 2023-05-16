import * as React from "react";
import { useMergeRefs } from "@floating-ui/react";
import { useTooltipContext } from "./TooltipContext";

export type TooltipTriggerProps = React.HTMLProps<HTMLElement> & {
  asChild?: boolean;
};
export type TooltipTriggerRef = React.Ref<HTMLElement>;

export const TooltipTrigger = React.forwardRef(function TooltipTrigger(
  props: TooltipTriggerProps,
  propRef: TooltipTriggerRef,
) {
  const { asChild = false, children, ...rest } = props;
  const context = useTooltipContext();
  const childrenRef = (children as any).ref;
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children,
      context.getReferenceProps({
        ref,
        ...rest,
        ...children.props,
        "data-tooltip-trigger": "",
        "data-state": context.open ? "open" : "closed",
      }),
    );
  }

  return (
    <button
      data-state={context.open ? "open" : "closed"}
      data-tooltip-trigger=""
      // The user can style the trigger based on the state
      ref={ref}
      {...context.getReferenceProps(rest)}
    >
      {children}
    </button>
  );
});
