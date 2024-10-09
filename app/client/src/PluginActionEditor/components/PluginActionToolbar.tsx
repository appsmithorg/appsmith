import React from "react";
import { IDEToolbar } from "IDE";
import { Button, Menu, MenuContent, MenuTrigger, Tooltip } from "@appsmith/ads";
import { modText } from "utils/helpers";
import { usePluginActionContext } from "../PluginActionContext";
import { useHandleRunClick } from "PluginActionEditor/hooks";
import { useToggle } from "@mantine/hooks";

interface PluginActionToolbarProps {
  runOptions?: React.ReactNode;
  children?: React.ReactNode[] | React.ReactNode;
  menuContent?: React.ReactNode[] | React.ReactNode;
}

const PluginActionToolbar = (props: PluginActionToolbarProps) => {
  const { action } = usePluginActionContext();
  const { handleRunClick } = useHandleRunClick();
  const [isMenuOpen, toggleMenuOpen] = useToggle([false, true]);

  return (
    <IDEToolbar>
      <IDEToolbar.Left>{props.children}</IDEToolbar.Left>
      <IDEToolbar.Right>
        {props.runOptions}
        <Tooltip
          content={modText() + " ⏎"}
          placement="topRight"
          showArrow={false}
        >
          <Button kind="primary" onClick={() => handleRunClick} size="sm">
            Run
          </Button>
        </Tooltip>
        <Button
          isIconButton
          kind="secondary"
          size="sm"
          startIcon="settings-2-line"
        />
        <Menu onOpenChange={toggleMenuOpen} open={isMenuOpen}>
          <MenuTrigger>
            <Button
              isIconButton
              kind="tertiary"
              size="sm"
              startIcon="more-2-fill"
            />
          </MenuTrigger>
          <MenuContent
            key={action.id}
            loop
            style={{ zIndex: 100 }}
            width="200px"
          >
            {props.menuContent}
          </MenuContent>
        </Menu>
      </IDEToolbar.Right>
    </IDEToolbar>
  );
};

export default PluginActionToolbar;
