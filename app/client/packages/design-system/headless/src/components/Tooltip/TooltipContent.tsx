import React, { forwardRef } from "react";
import {
  useMergeRefs,
  FloatingPortal,
  FloatingArrow,
} from "@floating-ui/react";

import { useTooltipContext } from "./TooltipContext";

export type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  root?: HTMLElement;
  className?: string;
};
export type TooltipContentRef = React.Ref<HTMLDivElement>;

const _TooltipContent = (
  props: TooltipContentProps,
  propRef: TooltipContentRef,
) => {
  const context = useTooltipContext();
  const { className, root: rootProp, ...rest } = props;
  const ref = useMergeRefs([context.refs.setFloating, propRef]);
  const { children, ...floatingProps } = context.getFloatingProps(rest);
  const arrowWidth = context.arrowRef.current?.clientWidth ?? 0;

  if (!context.open) return null;

  const root = context.refs.domReference.current?.closest(
    "[data-theme-provider]",
  ) as HTMLElement;

  return (
    <FloatingPortal root={rootProp ?? root}>
      <div
        className={className}
        data-tooltip-content=""
        data-tooltip-placement={context.placement}
        ref={ref}
        style={context.floatingStyles}
        {...floatingProps}
      >
        {children}
        <FloatingArrow
          context={context.context}
          data-tooltip-trigger-arrow=""
          ref={context.arrowRef}
          staticOffset={`calc(50% - ${arrowWidth / 2}px)`}
        />
      </div>
    </FloatingPortal>
  );
};

export const TooltipContent = forwardRef(_TooltipContent);
