import clsx from "clsx";
import React, { type ComponentProps, type Ref } from "react";

import styles from "./styles.module.css";

const _SidebarContent = (
  props: ComponentProps<"div">,
  ref: Ref<HTMLDivElement>,
) => {
  const { className, ...rest } = props;

  return (
    <div
      className={clsx(styles.sidebarContent, className)}
      data-sidebar="content"
      ref={ref}
      {...rest}
    />
  );
};

export const SidebarContent = React.forwardRef(_SidebarContent);
