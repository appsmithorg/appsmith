import React, { useCallback } from "react";
import { IDEToolbar } from "IDE";
import { Button, Menu, MenuContent, MenuTrigger, Tooltip } from "@appsmith/ads";
import { modText } from "utils/helpers";
import { PluginType } from "../../entities/Plugin";
import { getIsAnvilEnabledInCurrentApplication } from "../../layoutSystems/anvil/integrations/selectors";
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
  const { action, plugin } = usePluginActionContext();
  const { handleRunClick } = useHandleRunClick();
  const { callRunActionAnalytics } = useAnalyticsOnRunClick();
  const [isMenuOpen, toggleMenuOpen] = useToggle([false, true]);
  const blockExecution = useBlockExecution();
  const isRunning = useSelector(isActionRunning(action.id));
  const isAnvilEnabled = useSelector(getIsAnvilEnabledInCurrentApplication);

  const onRunClick = useCallback(() => {
    const isSkipOpeningDebugger =
      isAnvilEnabled && plugin.type === PluginType.AI;

    callRunActionAnalytics();
    handleRunClick(isSkipOpeningDebugger);
  }, [callRunActionAnalytics, handleRunClick, isAnvilEnabled, plugin.type]);

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
            data-testid="t--run-action"
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
              data-testid="t--more-action-trigger"
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
            width="204px"
          >
            {props.menuContent}
          </MenuContent>
        </Menu>
      </IDEToolbar.Right>
    </IDEToolbar>
  );
};

export default PluginActionToolbar;
