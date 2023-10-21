import type { Ref } from "react";
import React, { forwardRef } from "react";
import type { PopoverContentProps } from "@design-system/headless";
import { PopoverContent as HeadlessPopoverContent } from "@design-system/headless";
import styles from "./styles.module.css";

const _PopoverContent = (props: PopoverContentProps, ref: Ref<HTMLElement>) => {
  const { children } = props;
  return (
    <HeadlessPopoverContent className={styles.popover} ref={ref}>
      {children}
    </HeadlessPopoverContent>
  );
};

export const PopoverContent = forwardRef(_PopoverContent);
