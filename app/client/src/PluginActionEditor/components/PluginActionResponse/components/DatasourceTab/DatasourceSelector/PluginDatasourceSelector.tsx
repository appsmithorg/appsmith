import React from "react";
import { useSelector } from "react-redux";
import { Flex } from "@appsmith/ads";
import { CREATE_NEW_DATASOURCE, createMessage } from "ee/constants/messages";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getHasCreateDatasourcePermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { doesPluginRequireDatasource } from "ee/entities/Engine/actionHelpers";
import {
  getActionByBaseId,
  getDatasourceByPluginId,
  getPlugin,
  getPluginImages,
} from "ee/selectors/entitiesSelector";
import type { Datasource } from "entities/Datasource";
import type { AppState } from "ee/reducers";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { useActiveActionBaseId } from "ee/pages/Editor/Explorer/hooks";
import { INTEGRATION_TABS } from "constants/routes";
import MenuField from "components/editorComponents/form/fields/MenuField";
import type { InjectedFormProps } from "redux-form";
import { type Action } from "entities/Action";
import { CurrentDataSourceLink } from "../CurrentDataSourceLink";
import { CurrentDataSource } from "../CurrentDataSource";
import { useCreateDatasource } from "ee/PluginActionEditor/hooks/useCreateDatasource";

export interface CustomProps {
  datasourceId: string;
  datasourceName: string;
  formName: string;
}

type Props = InjectedFormProps<Action, CustomProps> & CustomProps;

interface DATASOURCES_OPTIONS_TYPE {
  label: string;
  value: string;
  image?: string;
  icon?: string;
  onSelect?: (value: string) => void;
}

export const PluginDatasourceSelector = ({
  datasourceId,
  datasourceName,
  formName,
}: Props) => {
  const activeActionBaseId = useActiveActionBaseId();
  const currentActionConfig = useSelector((state) =>
    activeActionBaseId
      ? getActionByBaseId(state, activeActionBaseId)
      : undefined,
  );
  const plugin = useSelector((state: AppState) =>
    getPlugin(state, currentActionConfig?.pluginId || ""),
  );

  const dataSources = useSelector((state: AppState) =>
    getDatasourceByPluginId(state, currentActionConfig?.pluginId || ""),
  );

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

  const { onCreateDatasourceClick } = useCreateDatasource();

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

  if (canCreateDatasource) {
    DATASOURCES_OPTIONS.push({
      label: createMessage(CREATE_NEW_DATASOURCE),
      value: "create",
      icon: "plus",
      onSelect: () =>
        onCreateDatasourceClick(
          INTEGRATION_TABS.NEW,
          currentActionConfig?.pageId,
        ),
    });
  }

  if (!showDatasourceSelector || !isChangePermitted) {
    return (
      <CurrentDataSourceLink
        datasourceId={datasourceId}
        datasourceName={datasourceName}
      />
    );
  }

  return (
    <Flex>
      <MenuField
        className={"t--switch-datasource"}
        formName={formName}
        name="datasource.id"
        options={DATASOURCES_OPTIONS}
      >
        <CurrentDataSource
          datasourceId={datasourceId}
          datasourceName={datasourceName}
        />
      </MenuField>
    </Flex>
  );
};
