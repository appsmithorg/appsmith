import React from "react";
import { useSelector } from "react-redux";
import { Icon } from "@appsmith/ads";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import { CREATE_NEW_DATASOURCE, createMessage } from "ee/constants/messages";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getHasCreateDatasourcePermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import type { Action } from "entities/Action";
import { doesPluginRequireDatasource } from "ee/entities/Engine/actionHelpers";
import { getPluginImages } from "ee/selectors/entitiesSelector";
import type { Datasource } from "entities/Datasource";
import type { Plugin } from "entities/Plugin";
import type { AppState } from "ee/reducers";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";

const DropdownSelect = styled.div`
  font-size: 14px;
  width: 230px;

  .rc-select-selector {
    min-width: unset;
  }
`;

const CreateDatasource = styled.div`
  display: flex;
  gap: 8px;
`;

interface Props {
  formName: string;
  currentActionConfig?: Action;
  plugin?: Plugin;
  dataSources: Datasource[];
  onCreateDatasourceClick: () => void;
}

interface DATASOURCES_OPTIONS_TYPE {
  label: string;
  value: string;
  image: string;
}

const DatasourceSelector = (props: Props) => {
  const {
    currentActionConfig,
    dataSources,
    formName,
    onCreateDatasourceClick,
    plugin,
  } = props;
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
  );
  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    currentActionConfig?.userPermissions,
  );
  const canCreateDatasource = getHasCreateDatasourcePermission(
    isFeatureEnabled,
    userWorkspacePermissions,
  );
  const showDatasourceSelector = doesPluginRequireDatasource(plugin);
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

  if (!showDatasourceSelector) return null;

  return (
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
  );
};

export default DatasourceSelector;
