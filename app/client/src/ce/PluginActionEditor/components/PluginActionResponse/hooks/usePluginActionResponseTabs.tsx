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
import { ApiResponseHeaders } from "PluginActionEditor/components/PluginActionResponse/components/ApiResponseHeaders";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { getErrorCount } from "selectors/debuggerSelectors";
import {
  getPluginActionDebuggerState,
  isActionRunning,
} from "PluginActionEditor/store";
import { doesPluginRequireDatasource } from "ee/entities/Engine/actionHelpers";
import useShowSchema from "PluginActionEditor/components/PluginActionResponse/hooks/useShowSchema";
import { Datasource } from "PluginActionEditor/components/PluginActionResponse/components/DatasourceTab";
import {
  useBlockExecution,
  useHandleRunClick,
  useAnalyticsOnRunClick,
} from "PluginActionEditor/hooks";
import useDebuggerTriggerClick from "components/editorComponents/Debugger/hooks/useDebuggerTriggerClick";
import { Response } from "PluginActionEditor/components/PluginActionResponse/components/Response";

function usePluginActionResponseTabs() {
  const { action, actionResponse, datasource, plugin } =
    usePluginActionContext();
  const { handleRunClick } = useHandleRunClick();
  const { callRunActionAnalytics } = useAnalyticsOnRunClick();

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
    callRunActionAnalytics();
    handleRunClick();
  };

  if (plugin.type === PluginType.API) {
    if (datasource && "id" in datasource) {
      tabs.push({
        key: DEBUGGER_TAB_KEYS.DATASOURCE_TAB,
        title: "Datasource",
        panelComponent: (
          <Datasource
            currentActionId={action.id}
            datasourceId={datasource?.id || ""}
            datasourceName={datasource?.name || ""}
          />
        ),
      });
    }

    tabs.push(
      {
        key: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
        title: createMessage(DEBUGGER_RESPONSE),
        panelComponent: (
          <Response
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
    );
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
    if (showSchema) {
      tabs.push({
        key: DEBUGGER_TAB_KEYS.DATASOURCE_TAB,
        title: "Datasource",
        panelComponent: (
          <Datasource
            currentActionId={action.id}
            datasourceId={datasource?.id || ""}
            datasourceName={datasource?.name || ""}
          />
        ),
      });
    }

    tabs.push({
      key: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
      title: createMessage(DEBUGGER_RESPONSE),
      panelComponent: (
        <Response
          action={action}
          actionResponse={actionResponse}
          isRunDisabled={blockExecution}
          isRunning={isRunning}
          onRunClick={onRunClick}
          responseTabHeight={responseTabHeight}
          theme={EditorTheme.LIGHT}
        />
      ),
    });
  }

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

  return tabs;
}

export default usePluginActionResponseTabs;
