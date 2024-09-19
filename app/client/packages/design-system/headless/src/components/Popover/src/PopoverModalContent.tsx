import React, { forwardRef, useEffect, useState } from "react";
import {
  FloatingFocusManager,
  FloatingPortal,
  useMergeRefs,
  FloatingOverlay,
  useTransitionStatus,
} from "@floating-ui/react";
import { usePopoverContext } from "./PopoverContext";

import type { Ref } from "react";
import type { PopoverModalContentProps } from "./types";

const setAriaAttrs = (
  triggerElem: HTMLElement,
  referenceProps: Record<string, unknown>,
) => {
  if (Boolean(referenceProps["aria-controls"])) {
    triggerElem?.setAttribute(
      "aria-controls",
      referenceProps["aria-controls"] as string,
    );
  }

  triggerElem?.setAttribute(
    "aria-expanded",
    referenceProps["aria-expanded"] as string,
  );

  triggerElem?.setAttribute(
    "aria-haspopup",
    referenceProps["aria-haspopup"] as string,
  );
};

const _PopoverModalContent = (
  props: PopoverModalContentProps,
  ref: Ref<HTMLElement>,
) => {
  const {
    children,
    closeOnFocusOut = true,
    contentClassName,
    overlayClassName,
    style,
    ...rest
  } = props;
  const {
    context,
    descriptionId,
    duration,
    getFloatingProps,
    getReferenceProps,
    initialFocus,
    labelId,
    onClose,
    triggerRef,
  } = usePopoverContext();
  const refs = useMergeRefs([context.refs.setFloating, ref]);
  const [root, setRoot] = useState<Element | null>(null);

  useEffect(() => {
    if (triggerRef?.current != null) {
      setRoot(triggerRef.current?.closest("[data-theme-provider]"));
    } else {
      setRoot(document.body.querySelector("[data-theme-provider]"));
    }
  }, [triggerRef?.current]);

  const referenceProps = getReferenceProps({ ref: refs });

  useEffect(() => {
    if (triggerRef?.current != null) {
      setAriaAttrs(triggerRef?.current, referenceProps);
    }
  }, [referenceProps, triggerRef?.current]);

  const { isMounted, status } = useTransitionStatus(context, { duration });

  useEffect(() => {
    if (!isMounted && status === "close" && onClose) {
      onClose();
    }
  }, [isMounted, status]);

  if (!Boolean(isMounted)) return null;

  return (
    <FloatingPortal root={root as HTMLElement}>
      <FloatingOverlay
        className={overlayClassName}
        data-status={status}
        lockScroll
      >
        <FloatingFocusManager
          closeOnFocusOut={closeOnFocusOut}
          context={context}
          initialFocus={initialFocus}
        >
          <div
            aria-describedby={descriptionId}
            aria-labelledby={labelId}
            className={contentClassName}
            data-status={status}
            ref={refs}
            style={style}
            {...getFloatingProps(rest)}
          >
            {children}
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
};

export const PopoverModalContent = forwardRef(_PopoverModalContent);
