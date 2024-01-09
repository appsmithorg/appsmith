import type { ReactNode } from "react";
import React from "react";
import { Flex } from "design-system";

const Container = (props: { children: ReactNode }) => {
  return (
    <Flex
      backgroundColor="#F8FAFC"
      borderBottom="#F1F5F9"
      gap="spaces-2"
      padding="spaces-2"
      width="100%"
    >
      {props.children}
    </Flex>
  );
};

export default Container;
