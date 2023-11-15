import React, { forwardRef } from "react";
import {
  FloatingFocusManager,
  FloatingPortal,
  useMergeRefs,
  FloatingOverlay,
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
    overlayClassName,
    style,
    ...rest
  } = props;
  const { context, descriptionId, duration, getFloatingProps, labelId, modal } =
    usePopoverContext();
  const refs = useMergeRefs([context.refs.setFloating, ref]);
  const { isMounted, status } = useTransitionStatus(context, { duration });

  if (!Boolean(isMounted)) return null;

  const root = context.refs.domReference.current?.closest(
    "[data-theme-provider]",
  ) as HTMLElement;

  const content = (
    <div
      aria-describedby={descriptionId}
      aria-labelledby={labelId}
      className={contentClassName}
      data-status={status}
      ref={refs}
      style={{
        ...(modal ? {} : context.floatingStyles),
        ...style,
      }}
      {...getFloatingProps(rest)}
    >
      {children}
    </div>
  );

  if (modal) {
    return (
      <FloatingPortal root={root}>
        <FloatingOverlay className={overlayClassName} data-status={status}>
          <FloatingFocusManager
            closeOnFocusOut={closeOnFocusOut}
            context={context}
            modal
          >
            {content}
          </FloatingFocusManager>
        </FloatingOverlay>
      </FloatingPortal>
    );
  } else {
    return (
      <FloatingPortal root={root}>
        <FloatingFocusManager
          closeOnFocusOut={closeOnFocusOut}
          context={context}
          modal={false}
        >
          {content}
        </FloatingFocusManager>
      </FloatingPortal>
    );
  }
};

export const PopoverContent = forwardRef(_PopoverContent);
