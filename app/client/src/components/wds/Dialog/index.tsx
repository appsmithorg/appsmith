import React, { forwardRef, PropsWithChildren, useRef } from "react";
import { useDialog } from "../hooks";
import { ComponentProps } from "../utils/types";
import { useCombinedRefs } from "../hooks/useCombinedRefs";

import styles from "./styles.module.css";

const noop = () => null;

export type DialogHeaderProps = PropsWithChildren<Record<string, never>>;

function DialogHeader({ children, ...rest }: DialogHeaderProps) {
  if (React.Children.toArray(children).every((ch) => typeof ch === "string")) {
    children = <p>{children}</p>;
  }

  return <div {...rest}>{children}</div>;
}

type InternalDialogProps = {
  isOpen?: boolean;
  onDismiss?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement>;
  returnFocusRef?: React.RefObject<HTMLElement>;
  children?: JSX.Element | JSX.Element[];
};

const Dialog = forwardRef<HTMLDivElement, InternalDialogProps>(
  (
    {
      children,
      onDismiss = noop,
      isOpen,
      initialFocusRef,
      returnFocusRef,
      ...props
    },
    forwardedRef,
  ) => {
    const overlayRef = useRef(null);
    const modalRef = useCombinedRefs(forwardedRef);
    const closeButtonRef = useRef(null);

    const onCloseClick = () => {
      onDismiss();
      if (returnFocusRef && returnFocusRef.current) {
        returnFocusRef.current.focus();
      }
    };

    const { getDialogProps } = useDialog({
      modalRef,
      onDismiss: onCloseClick,
      isOpen,
      initialFocusRef,
      closeButtonRef,
      returnFocusRef,
      overlayRef,
    });
    return isOpen ? (
      <>
        <span className={styles.overlay} ref={overlayRef} />
        <div
          aria-modal="true"
          className={styles.base}
          ref={modalRef}
          role="dialog"
          tabIndex={-1}
          {...props}
          {...getDialogProps()}
        >
          <button onClick={onCloseClick} ref={closeButtonRef} />
          {children}
        </div>
      </>
    ) : null;
  },
);

DialogHeader.defaultProps = {
  backgroundColor: "canvas.subtle",
};

DialogHeader.displayName = "Dialog.Header";
Dialog.displayName = "Dialog";

export type DialogProps = ComponentProps<typeof Dialog>;
export default Object.assign(Dialog, { Header: DialogHeader });
