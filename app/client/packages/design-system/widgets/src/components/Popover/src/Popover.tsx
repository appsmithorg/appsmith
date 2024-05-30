import React from "react";
import { Popover as HeadlessPopover } from "react-aria-components";
import styles from "./styles.module.css";
import type { PopoverProps } from "react-aria-components";

export const Popover = (props: PopoverProps) => {
  const { children, ...rest } = props;

  return (
    <HeadlessPopover className={styles.popover} {...rest}>
      {children}
    </HeadlessPopover>
  );
};
