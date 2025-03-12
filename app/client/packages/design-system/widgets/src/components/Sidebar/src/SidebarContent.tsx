import clsx from "clsx";
import React, { type ReactNode, type Ref } from "react";

import { Flex } from "../../Flex";
import { Text } from "../../Text";
import { Button } from "../../Button";
import styles from "./styles.module.css";
import { useSidebar } from "./use-sidebar";

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
  const { children, className, extraTitleButton, title, ...rest } = props;
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
        >
          {Boolean(title) && (
            <Text
              className={styles.sidebarTitle}
              fontWeight={500}
              lineClamp={1}
            >
              {title}
            </Text>
          )}

          <Flex>
            {extraTitleButton}
            {!isMobile && (
              <Button
                className={styles.sidebarHeaderExpandButton}
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
        </Flex>
        <div className={styles.sidebarContentInner}>{children}</div>
      </Flex>
    </div>
  );
};

export const SidebarContent = React.forwardRef(_SidebarContent);
