import React, { useCallback } from "react";
import { IDEToolbar } from "IDE";
import { Button, Menu, MenuContent, MenuTrigger, Tooltip } from "@appsmith/ads";
import { modText } from "utils/helpers";
import { usePluginActionContext } from "../PluginActionContext";
import {
  useBlockExecution,
  useHandleRunClick,
  useAnalyticsOnRunClick,
} from "../hooks";
import { useToggle } from "@mantine/hooks";
import { useSelector } from "react-redux";
import { isActionRunning } from "../store";
import PluginActionSettings from "./PluginActionSettings";

interface PluginActionToolbarProps {
  runOptions?: React.ReactNode;
  children?: React.ReactNode[] | React.ReactNode;
  menuContent?: React.ReactNode[] | React.ReactNode;
}

const PluginActionToolbar = (props: PluginActionToolbarProps) => {
  const { action } = usePluginActionContext();
  const { handleRunClick } = useHandleRunClick();
  const { callRunActionAnalytics } = useAnalyticsOnRunClick();
  const [isMenuOpen, toggleMenuOpen] = useToggle([false, true]);
  const blockExecution = useBlockExecution();
  const isRunning = useSelector(isActionRunning(action.id));

  const onRunClick = useCallback(() => {
    callRunActionAnalytics();
    handleRunClick();
  }, [callRunActionAnalytics, handleRunClick]);

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
          <Button
            isDisabled={blockExecution}
            isLoading={isRunning}
            kind="primary"
            onClick={onRunClick}
            size="sm"
          >
            Run
          </Button>
        </Tooltip>
        <PluginActionSettings />
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
