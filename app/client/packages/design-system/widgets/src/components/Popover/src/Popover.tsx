import clsx from "clsx";
import React from "react";
import type { PopoverProps } from "react-aria-components";
import { Popover as HeadlessPopover } from "react-aria-components";

import styles from "./styles.module.css";

export const Popover = (props: PopoverProps) => {
  const { children, className, ...rest } = props;

  return (
    <HeadlessPopover {...rest} className={clsx(styles.popover, className)}>
      {children}
    </HeadlessPopover>
  );
};
