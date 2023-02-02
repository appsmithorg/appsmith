import * as React from "react";
import {
  useMergeRefs,
  FloatingPortal,
  FloatingFocusManager,
} from "@floating-ui/react";
import { usePopoverContext } from "./PopoveContext";

export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement>
>(function PopoverContent(props, propRef) {
  const { context: floatingContext, ...context } = usePopoverContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);

  return (
    <FloatingPortal>
      {context.open && (
        <FloatingFocusManager context={floatingContext} modal={context.modal}>
          <div
            aria-describedby={context.descriptionId}
            aria-labelledby={context.labelId}
            ref={ref}
            style={{
              position: context.strategy,
              top: context.y ?? 0,
              left: context.x ?? 0,
              width: "max-content",
              ...props.style,
            }}
            {...context.getFloatingProps(props)}
          >
            {props.children}
          </div>
        </FloatingFocusManager>
      )}
    </FloatingPortal>
  );
});
