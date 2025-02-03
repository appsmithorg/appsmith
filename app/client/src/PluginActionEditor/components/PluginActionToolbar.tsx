import React, { useCallback } from "react";
import { IDEToolbar } from "IDE";
import { Button, Tooltip } from "@appsmith/ads";
import { modText } from "utils/helpers";
import { usePluginActionContext } from "../PluginActionContext";
import {
  useBlockExecution,
  useHandleRunClick,
  useAnalyticsOnRunClick,
} from "../hooks";
import { useSelector } from "react-redux";
import { isActionRunning } from "../store";
import PluginActionSettings from "./PluginActionSettings";
import { PluginActionContextMenu } from "./PluginActionContextMenu";

interface PluginActionToolbarProps {
  key: string;
  runOptions?: React.ReactNode;
  children?: React.ReactNode[] | React.ReactNode;
  menuContent?: React.ReactNode[] | React.ReactNode;
}

const PluginActionToolbar = (props: PluginActionToolbarProps) => {
  const { action } = usePluginActionContext();
  const { handleRunClick } = useHandleRunClick();
  const { callRunActionAnalytics } = useAnalyticsOnRunClick();
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
        {props.menuContent ? (
          <PluginActionContextMenu
            key={action.id}
            menuContent={props.menuContent}
          />
        ) : null}
      </IDEToolbar.Right>
    </IDEToolbar>
  );
};

export default PluginActionToolbar;
