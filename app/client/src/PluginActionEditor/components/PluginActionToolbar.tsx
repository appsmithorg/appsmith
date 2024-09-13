import React, { useCallback } from "react";
import { IDEToolbar } from "IDE";
import { Button, Menu, MenuContent, MenuTrigger, Tooltip } from "@appsmith/ads";
import { modText } from "utils/helpers";
import { usePluginActionContext } from "../PluginActionContext";
import { useDispatch } from "react-redux";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { runAction } from "../../actions/pluginActionActions";

interface PluginActionToolbarProps {
  runOptions?: React.ReactNode;
  children?: React.ReactNode[] | React.ReactNode;
  menuContent?: React.ReactNode[] | React.ReactNode;
}

const PluginActionToolbar = (props: PluginActionToolbarProps) => {
  const { action, datasource, plugin } = usePluginActionContext();
  const dispatch = useDispatch();
  const handleRunClick = useCallback(() => {
    AnalyticsUtil.logEvent("RUN_QUERY_CLICK", {
      actionName: action.name,
      actionId: action.id,
      pluginName: plugin.name,
      datasourceId: datasource?.id,
      isMock: datasource?.isMock,
    });
    dispatch(runAction(action.id));
  }, [
    action.id,
    action.name,
    datasource?.id,
    datasource?.isMock,
    dispatch,
    plugin.name,
  ]);
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
          <Button kind="primary" onClick={handleRunClick} size="sm">
            Run
          </Button>
        </Tooltip>
        <Button
          isIconButton
          kind="secondary"
          size="sm"
          startIcon="settings-2-line"
        />
        <Menu>
          <MenuTrigger>
            <Button
              isIconButton
              kind="tertiary"
              size="sm"
              startIcon="more-2-fill"
            />
          </MenuTrigger>
          <MenuContent loop style={{ zIndex: 100 }} width="200px">
            {props.menuContent}
          </MenuContent>
        </Menu>
      </IDEToolbar.Right>
    </IDEToolbar>
  );
};

export default PluginActionToolbar;
