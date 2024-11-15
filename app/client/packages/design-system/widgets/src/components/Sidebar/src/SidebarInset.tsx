import clsx from "clsx";
import * as React from "react";
import type { ComponentProps, Ref } from "react";

import styles from "./styles.module.css";

export const _SidebarInset = (
  props: ComponentProps<"main">,
  ref: Ref<HTMLDivElement>,
) => {
  const { className, ...rest } = props;

  return (
    <main
      className={clsx(styles.sidebarInset, className)}
      ref={ref}
      {...rest}
    />
  );
};

export const SidebarInset = React.forwardRef(_SidebarInset);
