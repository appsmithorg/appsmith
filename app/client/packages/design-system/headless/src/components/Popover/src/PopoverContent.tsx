import React, { forwardRef } from "react";
import {
  FloatingFocusManager,
  FloatingPortal,
  useMergeRefs,
} from "@floating-ui/react";
import { usePopoverContext } from "./PopoverContext";

import type { Ref } from "react";
import type { PopoverContentProps } from "./types";

const _PopoverContent = (props: PopoverContentProps, ref: Ref<HTMLElement>) => {
  const { children, className, closeOnFocusOut = true, style } = props;
  const { context, descriptionId, getFloatingProps, labelId, modal, open } =
    usePopoverContext();
  const refs = useMergeRefs([context.refs.setFloating, ref]);

  if (!Boolean(open)) return null;

  const root = context.refs.domReference.current?.closest(
    "[data-theme-provider]",
  ) as HTMLElement;

  return (
    <FloatingPortal root={root}>
      <FloatingFocusManager
        closeOnFocusOut={closeOnFocusOut}
        context={context}
        modal={modal}
      >
        <div
          aria-describedby={descriptionId}
          aria-labelledby={labelId}
          className={className}
          ref={refs}
          style={{ ...context.floatingStyles, ...style }}
          {...getFloatingProps(props)}
        >
          {children}
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  );
};

export const PopoverContent = forwardRef(_PopoverContent);
