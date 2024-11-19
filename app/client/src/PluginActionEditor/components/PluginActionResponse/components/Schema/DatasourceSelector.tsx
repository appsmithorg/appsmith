import React from "react";
import { useSelector } from "react-redux";
import {
  Button,
  Flex,
  Icon,
  Menu,
  MenuContent,
  MenuGroup,
  MenuGroupName,
  MenuItem,
  MenuTrigger,
  Text,
} from "@appsmith/ads";
import {
  CREATE_NEW_DATASOURCE,
  createMessage,
  DATASOURCE_SWITCHER_MENU_GROUP_NAME,
} from "ee/constants/messages";
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
import { CurrentDataSource } from "./CurrentDataSource";
import { useActiveActionBaseId } from "ee/pages/Editor/Explorer/hooks";
import { INTEGRATION_TABS } from "constants/routes";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { change } from "redux-form";
import { useDispatch } from "react-redux";
import { QUERY_EDITOR_FORM_NAME } from "ee/constants/forms";
import { useDataSourceNavigation } from "ee/PluginActionEditor/hooks/useDataSourceNavigation";

interface Props {
  datasourceId: string;
  datasourceName: string;
}

interface DATASOURCES_OPTIONS_TYPE {
  label: string;
  value: string;
  image: string;
}

const DatasourceSelector = ({ datasourceId, datasourceName }: Props) => {
  const dispatch = useDispatch();
  const [open, setIsOpen] = React.useState(false);
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

  const { onCreateDatasourceClick } = useDataSourceNavigation();

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

  if (!showDatasourceSelector || !isChangePermitted) {
    return (
      <CurrentDataSource
        datasourceId={datasourceId}
        datasourceName={datasourceName}
        type="link"
      />
    );
  }

  // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
  const onOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
  };

  const handleMenuSelect = (value: string) => {
    dispatch(change(QUERY_EDITOR_FORM_NAME, "datasource.id", value));
  };

  return (
    <Flex>
      <Menu onOpenChange={onOpenChange}>
        <MenuTrigger>
          <Button
            endIcon={open ? "arrow-up-s-line" : "arrow-down-s-line"}
            kind="tertiary"
            size="sm"
          >
            <CurrentDataSource
              datasourceId={datasourceId}
              datasourceName={datasourceName}
              type="trigger"
            />
          </Button>
        </MenuTrigger>
        <MenuContent align="start" loop width="235px">
          <MenuGroupName asChild>
            <Text kind="body-s">
              {createMessage(DATASOURCE_SWITCHER_MENU_GROUP_NAME)}
            </Text>
          </MenuGroupName>
          <MenuGroup>
            {DATASOURCES_OPTIONS.map((option) => (
              <MenuItem
                key={option.value}
                onSelect={() => handleMenuSelect(option.value)}
              >
                <Flex alignItems={"center"} gap="spaces-2">
                  <img
                    alt="Datasource"
                    className="plugin-image h-[12px] w-[12px]"
                    src={getAssetUrl(option.image)}
                  />
                  {option.label}
                </Flex>
              </MenuItem>
            ))}
          </MenuGroup>
          {canCreateDatasource && (
            <MenuItem
              onSelect={() =>
                onCreateDatasourceClick(
                  INTEGRATION_TABS.NEW,
                  currentActionConfig?.pageId,
                )
              }
            >
              <Flex gap="spaces-2">
                <Icon className="createIcon" name="plus" size="md" />
                {createMessage(CREATE_NEW_DATASOURCE)}
              </Flex>
            </MenuItem>
          )}
        </MenuContent>
      </Menu>
    </Flex>
  );
};

export { DatasourceSelector };
