import React from "react";
import { Popover, PopoverModalContent } from "@design-system/headless";
import styles from "./styles.module.css";
import type { ModalProps } from "./types";
import clsx from "clsx";

export const Modal = (props: ModalProps) => {
  const {
    children,
    overlayClassName,
    size = "medium",
    triggerRef,
    ...rest
  } = props;

  return (
    // don't forget to change the transition-duration CSS as well
    <Popover duration={200} modal triggerRef={triggerRef} {...rest}>
      <PopoverModalContent
        data-size={size}
        overlayClassName={clsx(styles.overlay, overlayClassName)}
      >
        {children}
      </PopoverModalContent>
    </Popover>
  );
};
