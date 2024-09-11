import React, { useContext } from "react";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import { Button } from "@appsmith/ads";
import { StyledFormRow } from "./EditorJSONtoForm";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getHasExecuteActionPermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useActiveActionBaseId } from "ee/pages/Editor/Explorer/hooks";
import { useSelector } from "react-redux";
import {
  getActionByBaseId,
  getPluginNameFromId,
} from "ee/selectors/entitiesSelector";
import { QueryEditorContext } from "./QueryEditorContext";
import type { Plugin } from "api/PluginApi";
import type { Datasource } from "entities/Datasource";
import type { AppState } from "ee/reducers";
import { SQL_DATASOURCES } from "constants/QueryEditorConstants";
import DatasourceSelector from "./DatasourceSelector";

const NameWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 50%;
  input {
    margin: 0;
    box-sizing: border-box;
  }
`;

const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 1 1 50%;
  justify-content: flex-end;
  gap: var(--ads-v2-spaces-3);
  width: 50%;
`;

interface Props {
  plugin?: Plugin;
  formName: string;
  dataSources: Datasource[];
  onCreateDatasourceClick: () => void;
  isRunning: boolean;
  onRunClick: () => void;
}

const QueryEditorHeader = (props: Props) => {
  const {
    dataSources,
    formName,
    isRunning,
    onCreateDatasourceClick,
    onRunClick,
    plugin,
  } = props;
  const { moreActionsMenu, saveActionName } = useContext(QueryEditorContext);

  const activeActionBaseId = useActiveActionBaseId();
  const currentActionConfig = useSelector((state) =>
    activeActionBaseId
      ? getActionByBaseId(state, activeActionBaseId)
      : undefined,
  );
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    currentActionConfig?.userPermissions,
  );

  const isExecutePermitted = getHasExecuteActionPermission(
    isFeatureEnabled,
    currentActionConfig?.userPermissions,
  );

  // get the current action's plugin name
  const currentActionPluginName = useSelector((state: AppState) =>
    getPluginNameFromId(state, currentActionConfig?.pluginId || ""),
  );

  let actionBody = "";
  if (!!currentActionConfig?.actionConfiguration) {
    if ("formData" in currentActionConfig?.actionConfiguration) {
      // if the action has a formData (the action is postUQI e.g. Oracle)
      actionBody =
        currentActionConfig.actionConfiguration.formData?.body?.data || "";
    } else {
      // if the action is pre UQI, the path is different e.g. mySQL
      actionBody = currentActionConfig.actionConfiguration?.body || "";
    }
  }

  // if (the body is empty and the action is an sql datasource) or the user does not have permission, block action execution.
  const blockExecution =
    (!actionBody && SQL_DATASOURCES.includes(currentActionPluginName)) ||
    !isExecutePermitted;

  return (
    <StyledFormRow>
      <NameWrapper>
        <ActionNameEditor
          disabled={!isChangePermitted}
          saveActionName={saveActionName}
        />
      </NameWrapper>
      <ActionsWrapper>
        {moreActionsMenu}
        <DatasourceSelector
          currentActionConfig={currentActionConfig}
          dataSources={dataSources}
          formName={formName}
          onCreateDatasourceClick={onCreateDatasourceClick}
          plugin={plugin}
        />
        <Button
          className="t--run-query"
          data-guided-tour-iid="run-query"
          isDisabled={blockExecution}
          isLoading={isRunning}
          onClick={onRunClick}
          size="md"
        >
          Run
        </Button>
      </ActionsWrapper>
    </StyledFormRow>
  );
};

export default QueryEditorHeader;
