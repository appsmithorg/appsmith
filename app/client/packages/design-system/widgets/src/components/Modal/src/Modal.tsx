import clsx from "clsx";
import React from "react";
import { Popover, PopoverModalContent } from "@appsmith/wds-headless";

import type { ModalProps } from "./types";
import styles from "./styles.module.css";

export const Modal = (props: ModalProps) => {
  const {
    children,
    overlayClassName,
    overlayProps = {},
    size = "medium",
    triggerRef,
    ...rest
  } = props;

  return (
    // don't forget to change the transition-duration CSS as well
    <Popover duration={200} modal triggerRef={triggerRef} {...rest}>
      <PopoverModalContent
        data-size={size}
        {...overlayProps}
        overlayClassName={clsx(styles.overlay, overlayClassName)}
      >
        {children}
      </PopoverModalContent>
    </Popover>
  );
};
