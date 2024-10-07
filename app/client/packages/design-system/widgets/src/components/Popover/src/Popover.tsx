import React from "react";
import type { PopoverProps } from "react-aria-components";
import { Popover as HeadlessPopover } from "react-aria-components";

import styles from "./styles.module.css";

export const Popover = (props: PopoverProps) => {
  const { children, ...rest } = props;

  return (
    <HeadlessPopover {...rest} className={styles.popover}>
      {children}
    </HeadlessPopover>
  );
};
