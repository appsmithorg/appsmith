import clsx from "clsx";
import React, { forwardRef, type Ref, useRef } from "react";
import {
  Modal as HeadlessModal,
  Dialog as HeadlessDialog,
  ModalOverlay as HeadlessModalOverlay,
} from "react-aria-components";
import { CSSTransition } from "react-transition-group";

import styles from "./styles.module.css";
import type { SheetProps } from "./types";

export function _Sheet(props: SheetProps, ref: Ref<HTMLDivElement>) {
  const {
    children,
    className,
    isOpen,
    onEntered,
    onExited,
    onOpenChange,
    position = "start",
    ...rest
  } = props;
  const root = document.body.querySelector(
    "[data-theme-provider]",
  ) as HTMLButtonElement;

  const overlayRef = useRef<HTMLDivElement>();

  return (
    <CSSTransition
      in={isOpen}
      nodeRef={overlayRef}
      onEntered={onEntered}
      onExited={onExited}
      timeout={300}
      unmountOnExit
    >
      <HeadlessModalOverlay
        UNSTABLE_portalContainer={root}
        className={clsx(styles.overlay, className)}
        isDismissable
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        // @ts-expect-error TS is unable to infer the correct type for the render prop
        ref={overlayRef}
      >
        <HeadlessModal
          className={clsx(styles.sheet, styles[position])}
          ref={ref}
          {...rest}
        >
          <HeadlessDialog aria-label="Sheet" className={styles.dialog}>
            {children}
          </HeadlessDialog>
        </HeadlessModal>
      </HeadlessModalOverlay>
    </CSSTransition>
  );
}

export const Sheet = forwardRef(_Sheet);
