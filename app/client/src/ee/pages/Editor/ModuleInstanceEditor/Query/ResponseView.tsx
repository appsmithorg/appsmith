import React from "react";

import QueryResponseView from "pages/Editor/QueryEditor/QueryResponseView";
import { useSelector } from "react-redux";
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
import type { ENTITY_TYPE, SourceEntity } from "entities/AppsmithConsole";

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
  const renderDebugger = useSelector(showDebuggerFlag);
  const actionResponse = useSelector((state) =>
    getModuleInstanceActionResponse(state, action.id),
  );
  const { error, isRunning } = useSelector((state) =>
    getIsModuleInstanceRunningStatus(state, moduleInstance.id),
  );
  const plugins = useSelector(getPlugins);
  const plugin = plugins.find((p) => p.id === action.pluginId);

  const actionSource: SourceEntity = {
    type: "MODULE_INSTANCE" as ENTITY_TYPE, // TODO (ASHIT): Fix this to add MODULE_INSTANCE to ENTITY_TYPE
    name: action.name,
    id: action.id,
  };

  const { responseDataTypes, responseDisplayFormat } =
    actionResponseDisplayDataFormats(actionResponse);

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
    <QueryResponseView
      actionName={moduleInstance.name}
      actionResponse={actionResponse}
      actionSource={actionSource}
      currentActionConfig={action}
      isExecutePermitted={isExecutePermitted}
      isRunning={isRunning}
      responseDataTypes={responseDataTypes}
      responseDisplayFormat={responseDisplayFormat}
      responseTabOnRunClick={onRunClick}
      runErrorMessage={error}
    />
  );
}

export default ResponseView;
