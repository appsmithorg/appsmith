import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { EntityGroupsList, Flex } from "@appsmith/ads";
import { useSelector } from "react-redux";
import {
  getDatasources,
  getDatasourcesGroupedByPluginCategory,
  getPluginImages,
  getPlugins,
} from "ee/selectors/entitiesSelector";
import history from "utils/history";
import { datasourcesEditorIdURL, integrationEditorURL } from "ee/RouteBuilder";
import { getSelectedDatasourceId } from "ee/navigation/FocusSelectors";
import { get } from "lodash";
import CreateDatasourceButton from "./CreateDatasourceButton";
import { useLocation } from "react-router";
import {
  createMessage,
  DATA_PANE_TITLE,
  DATASOURCE_BLANK_STATE_CTA,
  DATASOURCE_LIST_BLANK_DESCRIPTION,
} from "ee/constants/messages";
import PaneHeader from "IDE/Components/PaneHeader";
import { INTEGRATION_TABS } from "constants/routes";
import type { DefaultRootState } from "react-redux";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasCreateDatasourcePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { EmptyState } from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import PremiumFeatureTag from "components/editorComponents/PremiumFeatureTag";
import { PluginType } from "entities/Plugin";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";
import type { Datasource } from "entities/Datasource";

const PaneBody = styled.div`
  padding: var(--ads-v2-spaces-3) 0;
  height: calc(100vh - 120px);
  overflow-y: auto;
`;

const DatasourceIcon = styled.img`
  height: 16px;
  width: 16px;
`;

interface DataSidePaneProps {
  dsUsageMap: Record<string, string>;
}

export const DataSidePane = (props: DataSidePaneProps) => {
  const { dsUsageMap } = props;
  const basePageId = useSelector(getCurrentBasePageId) as string;
  const [currentSelectedDatasource, setCurrentSelectedDatasource] = useState<
    string | undefined
  >("");
  const datasources = useSelector(getDatasources);
  const groupedDatasources = useSelector(getDatasourcesGroupedByPluginCategory);
  const pluginImages = useSelector(getPluginImages);
  const plugins = useSelector(getPlugins);
  const location = useLocation();

  const isIntegrationsEnabledForPaid = useSelector((state: DefaultRootState) =>
    selectFeatureFlagCheck(
      state,
      FEATURE_FLAG.license_external_saas_plugins_enabled,
    ),
  );

  const goToDatasource = useCallback((id: string) => {
    history.push(datasourcesEditorIdURL({ datasourceId: id }));
  }, []);

  useEffect(() => {
    setCurrentSelectedDatasource(getSelectedDatasourceId(location.pathname));
  }, [location]);

  const userWorkspacePermissions = useSelector(
    (state: DefaultRootState) =>
      getCurrentAppWorkspace(state).userPermissions ?? [],
  );

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateDatasource = getHasCreateDatasourcePermission(
    isFeatureEnabled,
    userWorkspacePermissions,
  );

  const addButtonClickHandler = useCallback(() => {
    history.push(
      integrationEditorURL({
        basePageId,
        selectedTab: INTEGRATION_TABS.NEW,
      }),
    );
  }, [basePageId]);

  const blankStateButtonProps = useMemo(
    () => ({
      className: "t--add-datasource-button-blank-screen",
      testId: "t--add-datasource-button-blank-screen",
      text: createMessage(DATASOURCE_BLANK_STATE_CTA),
      onClick: canCreateDatasource ? addButtonClickHandler : undefined,
    }),
    [addButtonClickHandler, canCreateDatasource],
  );

  const shouldShowPremiumTag = useCallback(
    (datasource: Datasource) => {
      const plugin = plugins.find((p) => p.id === datasource.pluginId);

      if (!plugin) return false;

      if (
        plugin.type === PluginType.EXTERNAL_SAAS &&
        !isIntegrationsEnabledForPaid
      ) {
        return true;
      }

      return false;
    },
    [plugins, isIntegrationsEnabledForPaid],
  );

  return (
    <Flex flexDirection="column" height="100%" width="100%">
      <PaneHeader
        rightIcon={
          canCreateDatasource && datasources.length !== 0 ? (
            <CreateDatasourceButton />
          ) : undefined
        }
        title={createMessage(DATA_PANE_TITLE)}
      />
      <PaneBody>
        {datasources.length === 0 ? (
          <EmptyState
            button={blankStateButtonProps}
            description={createMessage(DATASOURCE_LIST_BLANK_DESCRIPTION)}
            icon={"datasource-v3"}
          />
        ) : null}
        <EntityGroupsList
          flexProps={{ px: "spaces-3" }}
          groups={Object.entries(groupedDatasources).map(([key, value]) => {
            return {
              groupTitle: key,
              items: value.map((data) => {
                return {
                  id: data.id,
                  title: data.name,
                  startIcon: (
                    <DatasourceIcon
                      src={getAssetUrl(pluginImages[data.pluginId])}
                    />
                  ),
                  description: get(dsUsageMap, data.id, ""),
                  descriptionType: "block",
                  className: "t--datasource",
                  isSelected: currentSelectedDatasource === data.id,
                  onClick: () => goToDatasource(data.id),
                  rightControl: shouldShowPremiumTag(data) && (
                    <PremiumFeatureTag />
                  ),
                };
              }),
              className: "",
            };
          })}
        />
      </PaneBody>
    </Flex>
  );
};
