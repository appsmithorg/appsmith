import React, { Children } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@design-system/headless";
import styles from "./styles.module.css";
import type { ModalProps } from "./types";
import clsx from "clsx";

export const Modal = (props: ModalProps) => {
  const {
    children,
    contentClassName,
    overlayClassName,
    size = "medium",
    ...rest
  } = props;
  const [trigger, ...content] = Children.toArray(children);

  return (
    <Popover duration={200} modal {...rest}>
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent
        contentClassName={clsx(styles.content, contentClassName)}
        data-size={size}
        overlayClassName={clsx(styles.overlay, overlayClassName)}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
};
