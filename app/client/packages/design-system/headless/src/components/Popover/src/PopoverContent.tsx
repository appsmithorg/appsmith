import React, { forwardRef, useEffect } from "react";
import {
  FloatingFocusManager,
  FloatingPortal,
  useMergeRefs,
  useTransitionStatus,
} from "@floating-ui/react";
import { usePopoverContext } from "./PopoverContext";

import type { Ref } from "react";
import type { PopoverContentProps } from "./types";

const _PopoverContent = (props: PopoverContentProps, ref: Ref<HTMLElement>) => {
  const {
    children,
    closeOnFocusOut = true,
    contentClassName,
    style,
    ...rest
  } = props;
  const {
    context,
    descriptionId,
    duration,
    getFloatingProps,
    labelId,
    onClose,
  } = usePopoverContext();
  const refs = useMergeRefs([context.refs.setFloating, ref]);
  const { isMounted, status } = useTransitionStatus(context, { duration });

  useEffect(() => {
    if (!isMounted && status === "close" && onClose) {
      onClose();
    }
  }, [isMounted, status]);

  if (!Boolean(isMounted)) return null;

  const root = context.refs.domReference.current?.closest(
    "[data-theme-provider]",
  ) as HTMLElement;

  return (
    <FloatingPortal root={root}>
      <FloatingFocusManager closeOnFocusOut={closeOnFocusOut} context={context}>
        <div
          aria-describedby={descriptionId}
          aria-labelledby={labelId}
          className={contentClassName}
          data-status={status}
          ref={refs}
          style={{
            ...context.floatingStyles,
            ...style,
          }}
          {...getFloatingProps(rest)}
        >
          {children}
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  );
};

export const PopoverContent = forwardRef(_PopoverContent);
