import React from "react";
import type { PopoverProps } from "react-aria-components";
import { Popover as HeadlessPopover } from "react-aria-components";

import styles from "./styles.module.css";

export const Popover = (props: PopoverProps) => {
  const { children, ...rest } = props;
  const root = document.body.querySelector(
    "[data-theme-provider]",
  ) as HTMLButtonElement;

  return (
    <HeadlessPopover
      {...rest}
      UNSTABLE_portalContainer={root}
      className={styles.popover}
    >
      {children}
    </HeadlessPopover>
  );
};
