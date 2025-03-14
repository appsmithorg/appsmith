import React, { useCallback } from "react";
import { IDEToolbar } from "IDE";
import { Button, Tooltip } from "@appsmith/ads";
import { modText } from "utils/helpers";
import { usePluginActionContext } from "../PluginActionContext";
import {
  useBlockExecution,
  useHandleRunClick,
  useAnalyticsOnRunClick,
  useHandleGenerateSchemaClick,
} from "../hooks";
import { useSelector } from "react-redux";
import {
  isActionRunning,
  isActionSaving,
  isActionSchemaGenerating,
} from "../store";
import PluginActionSettings from "./PluginActionSettings";
import { PluginActionContextMenu } from "./PluginActionContextMenu";

interface PluginActionToolbarProps {
  runOptions?: React.ReactNode;
  children?: React.ReactNode[] | React.ReactNode;
  menuContent?: React.ReactNode[] | React.ReactNode;
}

const PluginActionToolbar = (props: PluginActionToolbarProps) => {
  const { action } = usePluginActionContext();
  const { handleRunClick } = useHandleRunClick();
  const { handleGenerateSchemaClick } = useHandleGenerateSchemaClick();
  const { callRunActionAnalytics } = useAnalyticsOnRunClick();
  const blockExecution = useBlockExecution();
  const isRunning = useSelector(isActionRunning(action.id));
  const isSaving = useSelector(isActionSaving(action.id));
  const isSchemaGenerating = useSelector(isActionSchemaGenerating(action.id));

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
            isDisabled={blockExecution || isSchemaGenerating}
            isLoading={isRunning}
            kind="primary"
            onClick={onRunClick}
            size="sm"
          >
            Run
          </Button>
        </Tooltip>
        <Button
          data-testid="t--schema-action"
          isDisabled={blockExecution || isSaving}
          isLoading={isSchemaGenerating}
          kind="secondary"
          onClick={handleGenerateSchemaClick}
          size="sm"
        >
          Save
        </Button>
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
