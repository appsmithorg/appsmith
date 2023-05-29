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
    return React.cloneElement(
      children,
      context.getReferenceProps({
        ref,
        ...rest,
        ...children.props,
        "data-state": context.open ? "open" : "closed",
        // when the trigger is disabled, we want to make sure that the tooltip is
        // accessible with keyboard but visually disabled only
        visuallyDisabled: children.props.isDisabled ? true : undefined,
      }),
    );
  }

  return null;
});
