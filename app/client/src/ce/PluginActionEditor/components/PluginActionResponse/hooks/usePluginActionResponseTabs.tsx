import React from "react";
import { usePluginActionContext } from "PluginActionEditor/PluginActionContext";
import type { BottomTab } from "components/editorComponents/EntityBottomTabs";
import { getIDEViewMode } from "selectors/ideSelectors";
import { useSelector } from "react-redux";
import { EditorViewMode } from "ee/entities/IDE/constants";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/helpers";
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
import { noop } from "lodash";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { getErrorCount } from "selectors/debuggerSelectors";
import { getPluginActionDebuggerState } from "PluginActionEditor";

function usePluginActionResponseTabs() {
  const { action, actionResponse, plugin } = usePluginActionContext();

  const IDEViewMode = useSelector(getIDEViewMode);
  const errorCount = useSelector(getErrorCount);

  const { responseTabHeight } = useSelector(getPluginActionDebuggerState);

  const tabs: BottomTab[] = [];

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
            isRunDisabled={false}
            isRunning={false}
            onRunClick={noop}
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
            isRunDisabled={false}
            isRunning={false}
            onDebugClick={noop}
            onRunClick={noop}
          />
        ),
      },
    ]);
  }

  return tabs;
}

export default usePluginActionResponseTabs;
