import React from "react";
import {
  useMergeRefs,
  FloatingPortal,
  FloatingArrow,
} from "@floating-ui/react";

import { useTooltipContext } from "./TooltipContext";

export const TooltipContent = React.forwardRef(function TooltipContent(
  props: React.HTMLProps<HTMLDivElement>,
  propRef: React.Ref<HTMLDivElement>,
) {
  const context = useTooltipContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);

  if (!context.open) return null;

  const { children, ...rest } = context.getFloatingProps(props);

  return (
    <FloatingPortal id="canvas">
      <div
        data-tooltip-content=""
        ref={ref}
        style={context.floatingStyles}
        {...rest}
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
