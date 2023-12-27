import React, { forwardRef } from "react";
import { useMergeRefs } from "@floating-ui/react";

import { useTooltipContext } from "./TooltipContext";

export type TooltipTriggerRef = React.Ref<HTMLElement>;
export type TooltipTriggerProps = React.HTMLProps<HTMLElement>;

const _TooltipTrigger = (
  props: TooltipTriggerProps,
  propRef: TooltipTriggerRef,
) => {
  const { children, ...rest } = props;
  const context = useTooltipContext();
  // @ts-expect-error we don't know which type children will be
  const childrenRef = (children as unknown).ref;
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
        visuallyDisabled: Boolean(children.props.isDisabled) ? true : undefined,
      }),
    );
  }

  return null;
};

export const TooltipTrigger = forwardRef(_TooltipTrigger);
