import React from "react";
import { ExplorerContainerBorder, Flex } from "../../..";
import type { ExplorerContainerProps } from "./ExplorerContainer.types";

export const ExplorerContainer = (props: ExplorerContainerProps) => {
  return (
    <Flex
      borderRight={ExplorerContainerBorder[props.borderRight]}
      className={`relative ${props.className}`}
      flexDirection="column"
      height={props.height}
      overflow="hidden"
      width={props.width}
    >
      {props.children}
    </Flex>
  );
};
