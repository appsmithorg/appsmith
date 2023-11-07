import React, { Children } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@design-system/headless";
import styles from "./styles.module.css";
import type { ModalProps } from "./types";

export const Modal = (props: ModalProps) => {
  const { children, size = "medium" } = props;
  const [trigger, ...content] = Children.toArray(children);

  return (
    <Popover modal>
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent
        contentClassName={styles.content}
        data-size={size}
        overlayClassName={styles.overlay}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
};
