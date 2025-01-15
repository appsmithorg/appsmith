import React, { useContext } from "react";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import { Button } from "@appsmith/ads";
import { StyledFormRow } from "./EditorJSONtoForm";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasManageActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useActiveActionBaseId } from "ee/pages/Editor/Explorer/hooks";
import { useSelector } from "react-redux";
import { getActionByBaseId, getPlugin } from "ee/selectors/entitiesSelector";
import { QueryEditorContext } from "./QueryEditorContext";
import type { Plugin } from "entities/Plugin";
import type { Datasource } from "entities/Datasource";
import type { AppState } from "ee/reducers";
import DatasourceSelector from "./DatasourceSelector";
import { getSavingStatusForActionName } from "selectors/actionSelectors";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ActionUrlIcon } from "../Explorer/ExplorerIcons";

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
  isRunDisabled?: boolean;
  isRunning: boolean;
  onRunClick: () => void;
}

const QueryEditorHeader = (props: Props) => {
  const {
    dataSources,
    formName,
    isRunDisabled = false,
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

  const isDatasourceSelectorEnabled = useFeatureFlag(
    FEATURE_FLAG.release_ide_datasource_selector_enabled,
  );

  const currentPlugin = useSelector((state: AppState) =>
    getPlugin(state, currentActionConfig?.pluginId || ""),
  );

  const saveStatus = useSelector((state) =>
    getSavingStatusForActionName(state, currentActionConfig?.id || ""),
  );

  const iconUrl = getAssetUrl(currentPlugin?.iconLocation) || "";

  const icon = ActionUrlIcon(iconUrl);

  return (
    <StyledFormRow>
      <NameWrapper>
        <ActionNameEditor
          actionConfig={currentActionConfig}
          disabled={!isChangePermitted}
          icon={icon}
          saveActionName={saveActionName}
          saveStatus={saveStatus}
        />
      </NameWrapper>
      <ActionsWrapper>
        {moreActionsMenu}
        {isDatasourceSelectorEnabled && (
          <DatasourceSelector
            currentActionConfig={currentActionConfig}
            dataSources={dataSources}
            formName={formName}
            onCreateDatasourceClick={onCreateDatasourceClick}
            plugin={plugin}
          />
        )}
        <Button
          className="t--run-query"
          data-guided-tour-iid="run-query"
          isDisabled={isRunDisabled}
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
