import React, { useEffect, useState } from "react";

import QueryDebuggerTabs from "pages/Editor/QueryEditor/QueryDebuggerTabs";
import { useDispatch, useSelector } from "react-redux";
import {
  getIsModuleInstanceRunningStatus,
  getModuleInstanceActionResponse,
} from "@appsmith/selectors/moduleInstanceSelectors";
import { actionResponseDisplayDataFormats } from "pages/Editor/utils";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import { getPlugins } from "@appsmith/selectors/entitiesSelector";
import ApiResponseView from "components/editorComponents/ApiResponseView";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { PluginType, type Action } from "entities/Action";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import type { ENTITY_TYPE } from "@appsmith/entities/AppsmithConsole/utils";
import type { SourceEntity } from "entities/AppsmithConsole";
import { setDebuggerSelectedTab, showDebugger } from "actions/debuggerActions";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/helpers";
interface ResponseViewProps {
  action: Action;
  moduleInstance: ModuleInstance;
  onRunClick: () => void;
  isExecutePermitted: boolean;
}

function ResponseView({
  action,
  isExecutePermitted,
  moduleInstance,
  onRunClick,
}: ResponseViewProps) {
  const dispatch = useDispatch();
  const renderDebugger = useSelector(showDebuggerFlag);
  const actionResponse = useSelector((state) =>
    getModuleInstanceActionResponse(state, action.id),
  );
  const { error, isRunning } = useSelector((state) =>
    getIsModuleInstanceRunningStatus(state, moduleInstance.id),
  );
  const [showResponseOnFirstLoad, setShowResponseOnFirstLoad] =
    useState<boolean>(false);
  const plugins = useSelector(getPlugins);
  const plugin = plugins.find((p) => p.id === action.pluginId);

  const actionSource: SourceEntity = {
    type: "MODULE_INSTANCE" as ENTITY_TYPE, // TODO (ASHIT): Fix this to add MODULE_INSTANCE to ENTITY_TYPE
    name: action.name,
    id: action.id,
  };

  const { responseDataTypes, responseDisplayFormat } =
    actionResponseDisplayDataFormats(actionResponse);

  useEffect(() => {
    // actionResponse and responseDisplayFormat is present only when query has response available
    if (
      !!responseDisplayFormat?.title &&
      actionResponse.isExecutionSuccess &&
      !showResponseOnFirstLoad
    ) {
      dispatch(showDebugger(true));
      dispatch(setDebuggerSelectedTab(DEBUGGER_TAB_KEYS.RESPONSE_TAB));
      setShowResponseOnFirstLoad(true);
    }
  }, [
    responseDisplayFormat?.title,
    actionResponse?.isExecutionSuccess,
    showResponseOnFirstLoad,
  ]);

  // When multiple page load queries exist, we want to response tab by default for all of them
  // Hence this useEffect will reset showResponseOnFirstLoad flag used to track whether to show response tab or not
  useEffect(() => {
    if (!!action?.id) {
      setShowResponseOnFirstLoad(false);
    }
  }, [action?.id]);

  if (!renderDebugger) return null;

  if (plugin?.type === PluginType.API) {
    return (
      <ApiResponseView
        actionResponse={actionResponse}
        apiName={moduleInstance.name}
        currentActionConfig={action}
        disabled={!isExecutePermitted}
        isRunning={isRunning}
        onRunClick={onRunClick}
        responseDataTypes={responseDataTypes}
        responseDisplayFormat={responseDisplayFormat}
        theme={EditorTheme.LIGHT}
      />
    );
  }

  return (
    <QueryDebuggerTabs
      actionName={moduleInstance.name}
      actionResponse={actionResponse}
      actionSource={actionSource}
      currentActionConfig={action}
      isRunning={isRunning}
      onRunClick={onRunClick}
      runErrorMessage={error}
    />
  );
}

export default ResponseView;
