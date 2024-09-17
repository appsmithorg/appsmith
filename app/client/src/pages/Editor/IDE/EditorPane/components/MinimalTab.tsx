import React from "react";
import type { FlexProps } from "@appsmith/ads";
import { Flex } from "@appsmith/ads";

const MinimalTab = ({ children, ...rest }: FlexProps) => {
  return (
    <Flex
      alignItems="center"
      borderRadius="var(--ads-v2-border-radius)"
      className="hover:bg-[var(--ads-v2-colors-content-surface-hover-bg)]"
      cursor="pointer"
      flex="1"
      gap="spaces-2"
      height="100%"
      justifyContent="center"
      width="100%"
      {...rest}
    >
      {children}
    </Flex>
  );
};

export { MinimalTab };
