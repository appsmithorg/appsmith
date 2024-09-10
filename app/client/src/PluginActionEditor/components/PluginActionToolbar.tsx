import React from "react";
import { IDEToolbar } from "IDE";
import { Button, Tooltip } from "@appsmith/ads";

interface PluginActionToolbarProps {
  runOptions?: React.ReactNode;
  children?: React.ReactNode[] | React.ReactNode;
}

const PluginActionToolbar = (props: PluginActionToolbarProps) => {
  return (
    <IDEToolbar>
      <IDEToolbar.Left>{props.children}</IDEToolbar.Left>
      <IDEToolbar.Right>
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
      </IDEToolbar.Right>
    </IDEToolbar>
  );
};

export default PluginActionToolbar;
