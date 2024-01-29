import React from "react";
import { Flex } from "design-system";
import FormRender from "./FormRender";
import { UIComponentTypes } from "api/PluginApi";
import { getUIComponent } from "./helpers";
import { useSelector } from "react-redux";
import {
  getAction,
  getActionData,
  getPlugins,
} from "@appsmith/selectors/entitiesSelector";
import { getFormEvaluationState } from "selectors/formSelectors";
import type { QueryAction, SaaSAction } from "entities/Action";
import type { AppState } from "@appsmith/reducers";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/helpers";
import QueryResponseTabView from "./QueryResponseView";
import {
  getDebuggerSelectedTab,
  showDebuggerFlag,
} from "selectors/debuggerSelectors";
import type { ActionResponse } from "api/ActionAPI";
import type { SourceEntity } from "entities/AppsmithConsole";
import { ENTITY_TYPE as SOURCE_ENTITY_TYPE } from "../../../entities/AppsmithConsole";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasExecuteActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { actionResponseDisplayDataFormats } from "../utils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import ActionToolbar from "../IDE/EditorPane/components/ActionToolbar";
import { noop } from "lodash";

interface Props {
  actionName: string;
  actionResponse?: ActionResponse;
  isRunning: boolean;
  pluginId: string;
  formData: QueryAction | SaaSAction;
  formName: string;
  editorConfig?: any;
  onRunClick: () => void;
  runErrorMessage: string | undefined;
}

const QueryEditorCompact = (props: Props) => {
  const {
    actionName,
    actionResponse,
    editorConfig,
    formData,
    formName,
    isRunning,
    onRunClick,
    pluginId,
    runErrorMessage,
  } = props;
  const plugins = useSelector(getPlugins);
  let uiComponent = UIComponentTypes.DbEditorForm;
  if (!!pluginId) uiComponent = getUIComponent(pluginId, plugins);
  const activeActionId = useActiveAction();
  const currentActionConfig = useSelector((state) =>
    activeActionId ? getAction(state, activeActionId) : undefined,
  );

  const formEvaluationState = useSelector((state: AppState) => {
    // State to manage the evaluations for the form
    let evalState = {};

    // Fetching evaluations state only once the formData is populated
    if (!!formData) {
      evalState = getFormEvaluationState(state)[formData.id];
    }
    return evalState;
  });

  const renderDebugger = useSelector(showDebuggerFlag);
  const selectedResponseTab = useSelector(getDebuggerSelectedTab);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isExecutePermitted = getHasExecuteActionPermission(
    isFeatureEnabled,
    currentActionConfig?.userPermissions,
  );

  // action source for analytics.
  const actionSource: SourceEntity = {
    type: SOURCE_ENTITY_TYPE.ACTION,
    name: currentActionConfig ? currentActionConfig.name : "",
    id: currentActionConfig ? currentActionConfig.id : "",
  };
  const actionData = useSelector((state: AppState) =>
    activeActionId ? getActionData(state, activeActionId) : undefined,
  );
  const { responseDataTypes, responseDisplayFormat } =
    actionResponseDisplayDataFormats(actionData);

  const responseTabOnRunClick = () => {
    onRunClick();

    AnalyticsUtil.logEvent("RESPONSE_TAB_RUN_ACTION_CLICK", {
      source: "QUERY_PANE",
    });
  };

  return (
    <Flex flexDirection="column">
      <Flex flexDirection="column" overflowY="scroll" padding="spaces-3">
        <FormRender
          editorConfig={editorConfig}
          formData={formData}
          formEvaluationState={formEvaluationState}
          formName={formName}
          uiComponent={uiComponent}
        />
      </Flex>
      <ActionToolbar onRunClick={onRunClick} onSettingsClick={noop} />
      {renderDebugger &&
        selectedResponseTab !== DEBUGGER_TAB_KEYS.HEADER_TAB && (
          <QueryResponseTabView
            actionName={actionName}
            actionResponse={actionResponse}
            actionSource={actionSource}
            currentActionConfig={currentActionConfig}
            isExecutePermitted={isExecutePermitted}
            isRunning={isRunning}
            responseDataTypes={responseDataTypes}
            responseDisplayFormat={responseDisplayFormat}
            responseTabOnRunClick={responseTabOnRunClick}
            runErrorMessage={runErrorMessage}
          />
        )}
    </Flex>
  );
};

export default QueryEditorCompact;
