import React from "react";
import { Button, Flex, Tooltip } from "@appsmith/ads";

interface ToolbarProps {
  children?: React.ReactNode[];
  runOptionSelector?: React.ReactNode;
}

const Toolbar = (props: ToolbarProps) => {
  return (
    <Flex
      alignItems="center"
      borderBottom="1px solid var(--ads-v2-color-border-muted);"
      flexDirection="row"
      height="33px"
      justifyContent="space-between"
      padding="spaces-2"
    >
      <Flex alignItems="center" flexDirection="row" gap="spaces-2">
        {props.children}
      </Flex>
      <Flex alignItems="center" flexDirection="row" gap="spaces-2">
        {props.runOptionSelector}
        <Tooltip content={"⌘ + ⏎"} placement="topRight" showArrow={false}>
          <Button kind="primary" size="sm">
            Run
          </Button>
        </Tooltip>
        <Button
          isIconButton
          kind="secondary"
          size="sm"
          startIcon="settings-2-line"
        />
        <Button
          isIconButton
          kind="tertiary"
          size="sm"
          startIcon="more-2-fill"
        />
      </Flex>
    </Flex>
  );
};

export default Toolbar;
