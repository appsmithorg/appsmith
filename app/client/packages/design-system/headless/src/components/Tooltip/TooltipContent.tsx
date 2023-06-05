import React from "react";
import {
  useMergeRefs,
  FloatingPortal,
  FloatingArrow,
} from "@floating-ui/react";

import { useTooltipContext } from "./TooltipContext";

export type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  root?: HTMLElement;
};
export type TooltipContentRef = React.Ref<HTMLDivElement>;

export const TooltipContent = React.forwardRef(function TooltipContent(
  props: TooltipContentProps,
  propRef: TooltipContentRef,
) {
  const context = useTooltipContext();
  const { root: rootProp, ...rest } = props;
  const ref = useMergeRefs([context.refs.setFloating, propRef]);
  const { children, ...floatingProps } = context.getFloatingProps(rest);

  if (!context.open) return null;

  const root = context.refs.domReference.current?.closest(
    "[data-theme-provider]",
  ) as HTMLElement;

  return (
    <FloatingPortal root={rootProp ?? root}>
      <div
        data-tooltip-content=""
        ref={ref}
        style={context.floatingStyles}
        {...floatingProps}
      >
        {children}
        <FloatingArrow
          context={context.context}
          data-tooltip-trigger-arrow=""
          ref={context.arrowRef}
        />
      </div>
    </FloatingPortal>
  );
});
