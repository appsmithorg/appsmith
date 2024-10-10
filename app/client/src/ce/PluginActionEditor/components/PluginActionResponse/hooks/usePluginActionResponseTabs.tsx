import React from "react";
import { usePluginActionContext } from "PluginActionEditor/PluginActionContext";
import type { BottomTab } from "components/editorComponents/EntityBottomTabs";
import { getIDEViewMode } from "selectors/ideSelectors";
import { useSelector } from "react-redux";
import { EditorViewMode } from "ee/entities/IDE/constants";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/constants";
import {
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_HEADERS,
  DEBUGGER_LOGS,
  DEBUGGER_RESPONSE,
} from "ee/constants/messages";
import ErrorLogs from "components/editorComponents/Debugger/Errors";
import DebuggerLogs from "components/editorComponents/Debugger/DebuggerLogs";
import { PluginType } from "entities/Action";
import { ApiResponse } from "PluginActionEditor/components/PluginActionResponse/components/ApiResponse";
import { ApiResponseHeaders } from "PluginActionEditor/components/PluginActionResponse/components/ApiResponseHeaders";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { getErrorCount } from "selectors/debuggerSelectors";
import {
  getPluginActionDebuggerState,
  isActionRunning,
} from "PluginActionEditor/store";
import { doesPluginRequireDatasource } from "ee/entities/Engine/actionHelpers";
import useShowSchema from "components/editorComponents/ActionRightPane/useShowSchema";
import Schema from "components/editorComponents/Debugger/Schema";
import QueryResponseTab from "pages/Editor/QueryEditor/QueryResponseTab";
import type { SourceEntity } from "entities/AppsmithConsole";
import { ENTITY_TYPE as SOURCE_ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import { useBlockExecution, useHandleRunClick } from "PluginActionEditor/hooks";
import useDebuggerTriggerClick from "components/editorComponents/Debugger/hooks/useDebuggerTriggerClick";

function usePluginActionResponseTabs() {
  const { action, actionResponse, datasource, plugin } =
    usePluginActionContext();
  const { handleRunClick } = useHandleRunClick();

  const IDEViewMode = useSelector(getIDEViewMode);
  const errorCount = useSelector(getErrorCount);
  const pluginRequireDatasource = doesPluginRequireDatasource(plugin);

  const showSchema = useShowSchema(plugin.id) && pluginRequireDatasource;

  const { responseTabHeight } = useSelector(getPluginActionDebuggerState);

  const onDebugClick = useDebuggerTriggerClick();
  const isRunning = useSelector(isActionRunning(action.id));
  const blockExecution = useBlockExecution();

  const tabs: BottomTab[] = [];

  const onRunClick = () => {
    handleRunClick();
  };

  if (IDEViewMode === EditorViewMode.FullScreen) {
    tabs.push(
      {
        key: DEBUGGER_TAB_KEYS.ERROR_TAB,
        title: createMessage(DEBUGGER_ERRORS),
        count: errorCount,
        panelComponent: <ErrorLogs />,
      },
      {
        key: DEBUGGER_TAB_KEYS.LOGS_TAB,
        title: createMessage(DEBUGGER_LOGS),
        panelComponent: <DebuggerLogs searchQuery={action.name} />,
      },
    );
  }

  if (plugin.type === PluginType.API) {
    return tabs.concat([
      {
        key: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
        title: createMessage(DEBUGGER_RESPONSE),
        panelComponent: (
          <ApiResponse
            action={action}
            actionResponse={actionResponse}
            isRunDisabled={blockExecution}
            isRunning={isRunning}
            onRunClick={onRunClick}
            responseTabHeight={responseTabHeight}
            theme={EditorTheme.LIGHT}
          />
        ),
      },
      {
        key: DEBUGGER_TAB_KEYS.HEADER_TAB,
        title: createMessage(DEBUGGER_HEADERS),
        panelComponent: (
          <ApiResponseHeaders
            actionResponse={actionResponse}
            isRunDisabled={blockExecution}
            isRunning={isRunning}
            onDebugClick={onDebugClick}
            onRunClick={onRunClick}
          />
        ),
      },
    ]);
  }

  if (
    [
      PluginType.DB,
      PluginType.AI,
      PluginType.REMOTE,
      PluginType.SAAS,
      PluginType.INTERNAL,
    ].includes(plugin.type)
  ) {
    const newTabs = [];

    const actionSource: SourceEntity = {
      type: SOURCE_ENTITY_TYPE.ACTION,
      name: action.name,
      id: action.id,
    };

    if (showSchema) {
      newTabs.push({
        key: DEBUGGER_TAB_KEYS.SCHEMA_TAB,
        title: "Schema",
        panelComponent: (
          <Schema
            currentActionId={action.id}
            datasourceId={datasource?.id || ""}
            datasourceName={datasource?.name || ""}
          />
        ),
      });
    }

    newTabs.push({
      key: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
      title: createMessage(DEBUGGER_RESPONSE),
      panelComponent: (
        <QueryResponseTab
          actionName={action.name}
          actionSource={actionSource}
          currentActionConfig={action}
          isRunning={isRunning}
          onRunClick={onRunClick}
          runErrorMessage={""} // TODO
        />
      ),
    });

    return tabs.concat(newTabs);
  }

  return tabs;
}

export default usePluginActionResponseTabs;
