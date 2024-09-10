import React from "react";
import { Toolbar, ToolbarLeft, ToolbarRight } from "IDE/Components/Toolbar";
import { Button, Tooltip } from "@appsmith/ads";

interface PluginActionToolbarProps {
  runOptions?: React.ReactNode;
  children?: React.ReactNode[] | React.ReactNode;
}

const PluginActionToolbar = (props: PluginActionToolbarProps) => {
  return (
    <Toolbar>
      <ToolbarLeft>{props.children}</ToolbarLeft>
      <ToolbarRight>
        {props.runOptions}
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
      </ToolbarRight>
    </Toolbar>
  );
};

export default PluginActionToolbar;
