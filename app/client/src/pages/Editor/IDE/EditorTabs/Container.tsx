import type { ReactNode } from "react";
import React from "react";
import { Flex } from "design-system";

const Container = (props: { children: ReactNode }) => {
  return (
    <Flex
      alignItems="center"
      backgroundColor="#FFFFFF"
      borderBottom="1px solid var(--ads-v2-color-border-muted)"
      gap="spaces-2"
      id="ide-tabs-container"
      maxHeight="32px"
      minHeight="32px"
      px="spaces-2"
      width="100%"
    >
      {props.children}
    </Flex>
  );
};

export default Container;
