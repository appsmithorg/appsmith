import clsx from "clsx";
import React, { type ReactNode, type Ref } from "react";

import { Flex } from "../../Flex";
import styles from "./styles.module.css";

interface SidebarContentProps {
  title?: string;
  extraTitleButton?: ReactNode;
  className?: string;
  children: React.ReactNode;
}

const _SidebarContent = (
  props: SidebarContentProps,
  ref: Ref<HTMLDivElement>,
) => {
  const { children, className, ...rest } = props;

  return (
    <div
      className={clsx(styles.sidebarContent, className)}
      data-sidebar="content"
      ref={ref}
      {...rest}
    >
      <Flex direction="column" height="100%" isInner>
        <div className={styles.sidebarContentInner}>{children}</div>
      </Flex>
    </div>
  );
};

export const SidebarContent = React.forwardRef(_SidebarContent);
