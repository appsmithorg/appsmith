import React, { useCallback, useEffect, useState } from "react";
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
import { workspaceDatasourceEditorURL } from "ee/RouteBuilder";
import { Button } from "@appsmith/ads";
import { useLocation } from "react-router";
import {
  createMessage,
  DATA_PANE_TITLE,
  DATASOURCE_BLANK_STATE_CTA,
  DATASOURCE_LIST_BLANK_DESCRIPTION,
} from "ee/constants/messages";
import PaneHeader from "IDE/Components/PaneHeader";
import type { DefaultRootState } from "react-redux";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasCreateDatasourcePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { EmptyState } from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { getSelectedDatasourceId } from "ee/navigation/FocusSelectors";
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

interface WorkspaceDataSidePaneProps {
  workspaceId: string;
}

export const WorkspaceDataSidePane = (props: WorkspaceDataSidePaneProps) => {
  const { workspaceId } = props;
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

  const goToDatasource = useCallback(
    (id: string) => {
      history.push(workspaceDatasourceEditorURL(workspaceId, id));
    },
    [workspaceId],
  );

  useEffect(() => {
    setCurrentSelectedDatasource(getSelectedDatasourceId(location.pathname));
  }, [location]);

  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const userWorkspacePermissions = currentWorkspace?.userPermissions ?? [];

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isFetchingCurrentWorkspace = useSelector(
    (state: DefaultRootState) =>
      state.ui.selectedWorkspace.loadingStates.isFetchingCurrentWorkspace,
  );

  const canCreateDatasource = getHasCreateDatasourcePermission(
    isFeatureEnabled,
    userWorkspacePermissions,
  );

  const addButtonClickHandler = useCallback(() => {
    history.push(`/workspace/${workspaceId}/datasources/NEW`);
  }, [workspaceId]);

  const blankStateButtonProps = {
    className: "t--add-datasource-button-blank-screen",
    testId: "t--add-datasource-button-blank-screen",
    text: createMessage(DATASOURCE_BLANK_STATE_CTA),
    onClick: canCreateDatasource ? addButtonClickHandler : undefined,
  };

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

  // Show loading state if workspace is being fetched
  if (isFetchingCurrentWorkspace) {
    return (
      <Flex
        alignItems="center"
        flexDirection="column"
        height="100%"
        justifyContent="center"
        width="100%"
      >
        <div>Loading workspace permissions...</div>
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" height="100%" width="100%">
      <PaneHeader
        rightIcon={
          canCreateDatasource ? (
            <Button
              className={"t--add-datasource-button"}
              isIconButton
              kind="tertiary"
              onClick={() =>
                history.push(`/workspace/${workspaceId}/datasources/NEW`)
              }
              size="sm"
              startIcon="add-line"
            />
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
