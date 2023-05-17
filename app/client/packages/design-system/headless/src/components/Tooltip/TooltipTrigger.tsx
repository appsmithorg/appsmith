import * as React from "react";
import { useMergeRefs } from "@floating-ui/react";

import { useTooltipContext } from "./TooltipContext";

export type TooltipTriggerRef = React.Ref<HTMLElement>;
export type TooltipTriggerProps = React.HTMLProps<HTMLElement>;

export const TooltipTrigger = React.forwardRef(function TooltipTrigger(
  props: TooltipTriggerProps,
  propRef: TooltipTriggerRef,
) {
  const { children, ...rest } = props;
  const context = useTooltipContext();
  const childrenRef = (children as any).ref;
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  if (React.isValidElement(children)) {
    return (
      <div
        {...context.getReferenceProps({
          ref,
          ...rest,
          ...children.props,
          "data-tooltip-trigger": "",
          "data-state": context.open ? "open" : "closed",
        })}
      >
        {children}
      </div>
    );
  }

  return null;
});
