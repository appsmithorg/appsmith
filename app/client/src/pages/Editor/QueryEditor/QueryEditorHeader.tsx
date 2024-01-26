import React, { useContext } from "react";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import { Button, Icon } from "design-system";
import {
  CREATE_NEW_DATASOURCE,
  createMessage,
} from "@appsmith/constants/messages";
import { StyledFormRow } from "./EditorJSONtoForm";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  getHasCreateDatasourcePermission,
  getHasExecuteActionPermission,
  getHasManageActionPermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import { useSelector } from "react-redux";
import {
  getAction,
  getPluginImages,
  getPluginNameFromId,
} from "@appsmith/selectors/entitiesSelector";
import { QueryEditorContext } from "./QueryEditorContext";
import { isAppsmithAIPlugin } from "utils/editorContextUtils";
import type { Plugin } from "api/PluginApi";
import { doesPluginRequireDatasource } from "@appsmith/entities/Engine/actionHelpers";
import type { Datasource } from "entities/Datasource";
import type { AppState } from "@appsmith/reducers";
import { getCurrentAppWorkspace } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { SQL_DATASOURCES } from "constants/QueryEditorConstants";

const NameWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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
`;

const DropdownSelect = styled.div`
  font-size: 14px;
  width: 230px;
`;

const CreateDatasource = styled.div`
  display: flex;
  gap: 8px;
`;
interface Props {
  plugin?: Plugin;
  formName: string;
  dataSources: Datasource[];
  onCreateDatasourceClick: () => void;
  isRunning: boolean;
  onRunClick: () => void;
}

interface DATASOURCES_OPTIONS_TYPE {
  label: string;
  value: string;
  image: string;
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

  const activeActionId = useActiveAction();
  const currentActionConfig = useSelector((state) =>
    activeActionId ? getAction(state, activeActionId) : undefined,
  );
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    currentActionConfig?.userPermissions,
  );
  const pluginRequireDatasource = doesPluginRequireDatasource(plugin);
  // Datasource selection is hidden for Appsmith AI Plugin and for plugins that don't require datasource
  // TODO: @Diljit Remove this condition when knowledge retrieval for Appsmith AI is implemented (Only remove the AI Condition)
  const showDatasourceSelector =
    !isAppsmithAIPlugin(plugin?.packageName) && pluginRequireDatasource;

  const pluginImages = useSelector(getPluginImages);

  const DATASOURCES_OPTIONS: Array<DATASOURCES_OPTIONS_TYPE> =
    dataSources.reduce(
      (acc: Array<DATASOURCES_OPTIONS_TYPE>, dataSource: Datasource) => {
        if (dataSource.pluginId === plugin?.id) {
          acc.push({
            label: dataSource.name,
            value: dataSource.id,
            image: pluginImages[dataSource.pluginId],
          });
        }
        return acc;
      },
      [],
    );

  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
  );

  const canCreateDatasource = getHasCreateDatasourcePermission(
    isFeatureEnabled,
    userWorkspacePermissions,
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
        {showDatasourceSelector && (
          <DropdownSelect>
            <DropdownField
              className={"t--switch-datasource"}
              formName={formName}
              isDisabled={!isChangePermitted}
              name="datasource.id"
              options={DATASOURCES_OPTIONS}
              placeholder="Datasource"
            >
              {canCreateDatasource && (
                // this additional div is here so that rc-select can render the child with the onClick correctly
                <div>
                  <CreateDatasource onClick={() => onCreateDatasourceClick()}>
                    <Icon className="createIcon" name="plus" size="md" />
                    {createMessage(CREATE_NEW_DATASOURCE)}
                  </CreateDatasource>
                </div>
              )}
            </DropdownField>
          </DropdownSelect>
        )}
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
