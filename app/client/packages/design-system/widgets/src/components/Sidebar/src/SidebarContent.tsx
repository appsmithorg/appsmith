import clsx from "clsx";
import React, { type Ref } from "react";

import { Flex } from "../../Flex";
import { Text } from "../../Text";
import { Button } from "../../Button";
import styles from "./styles.module.css";
import { useSidebar } from "./use-sidebar";

interface SidebarContentProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

const _SidebarContent = (
  props: SidebarContentProps,
  ref: Ref<HTMLDivElement>,
) => {
  const { children, className, title, ...rest } = props;
  const { isMobile, setState, state } = useSidebar();

  return (
    <div
      className={clsx(styles.sidebarContent, className)}
      data-sidebar="content"
      ref={ref}
      {...rest}
    >
      <Flex direction="column" height="100%" isInner>
        <Flex
          alignItems="center"
          className={styles.sidebarHeader}
          isInner
          justifyContent="space-between"
          padding="spacing-2"
        >
          {Boolean(title) && <Text lineClamp={1}>{title}</Text>}
          {!isMobile && (
            <Button
              color="neutral"
              icon={
                state === "full-width"
                  ? "arrows-diagonal-minimize"
                  : "arrows-diagonal-2"
              }
              onPress={() =>
                setState(state === "full-width" ? "expanded" : "full-width")
              }
              variant="ghost"
            />
          )}
        </Flex>
        <div className={styles.sidebarContentInner}>{children}</div>
      </Flex>
    </div>
  );
};

export const SidebarContent = React.forwardRef(_SidebarContent);
