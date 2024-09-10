import React from "react";
import { Flex } from "@appsmith/ads";

interface ToolbarProps {
  children?: React.ReactNode[] | React.ReactNode;
}

const Toolbar = (props: ToolbarProps) => {
  return (
    <Flex
      alignItems="center"
      borderBottom="1px solid var(--ads-v2-color-border-muted);"
      flexDirection="row"
      height="32px"
      justifyContent="space-between"
      padding="spaces-2"
    >
      {props.children}
    </Flex>
  );
};

const ToolbarLeft = (props: ToolbarProps) => {
  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      gap="spaces-2"
      justifySelf="flex-start"
    >
      {props.children}
    </Flex>
  );
};

const ToolbarRight = (props: ToolbarProps) => {
  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      gap="spaces-2"
      justifySelf="flex-end"
    >
      {props.children}
    </Flex>
  );
};

export { Toolbar, ToolbarLeft, ToolbarRight };
