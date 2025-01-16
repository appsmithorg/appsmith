import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { EntityGroupsList, Flex } from "@appsmith/ads";
import { useSelector } from "react-redux";
import {
  getDatasourceUsageCountForApp,
  getDatasources,
  getDatasourcesGroupedByPluginCategory,
  getPlugins,
} from "ee/selectors/entitiesSelector";
import history from "utils/history";
import { datasourcesEditorIdURL, integrationEditorURL } from "ee/RouteBuilder";
import { getSelectedDatasourceId } from "ee/navigation/FocusSelectors";
import { get, keyBy } from "lodash";
import CreateDatasourcePopover from "./CreateDatasourcePopover";
import { useLocation } from "react-router";
import {
  createMessage,
  DATA_PANE_TITLE,
  DATASOURCE_BLANK_STATE_CTA,
  DATASOURCE_LIST_BLANK_DESCRIPTION,
} from "ee/constants/messages";
import PaneHeader from "./PaneHeader";
import { useEditorType } from "ee/hooks";
import { INTEGRATION_TABS } from "constants/routes";
import type { AppState } from "ee/reducers";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasCreateDatasourcePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { EmptyState } from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { getCurrentBasePageId } from "selectors/editorSelectors";

const PaneBody = styled.div`
  padding: var(--ads-v2-spaces-3) 0;
  height: calc(100vh - 120px);
  overflow-y: scroll;
`;

const DatasourceIcon = styled.img`
  height: 16px;
  width: 16px;
`;

interface DataSidePaneProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dsUsageSelector?: (...args: any[]) => Record<string, string>;
}

const DataSidePane = (props: DataSidePaneProps) => {
  const { dsUsageSelector = getDatasourceUsageCountForApp } = props;
  const editorType = useEditorType(history.location.pathname);
  const basePageId = useSelector(getCurrentBasePageId) as string;
  const [currentSelectedDatasource, setCurrentSelectedDatasource] = useState<
    string | undefined
  >("");
  const datasources = useSelector(getDatasources);
  const groupedDatasources = useSelector(getDatasourcesGroupedByPluginCategory);
  const plugins = useSelector(getPlugins);
  const groupedPlugins = keyBy(plugins, "id");
  const dsUsageMap = useSelector((state) => dsUsageSelector(state, editorType));
  const goToDatasource = useCallback((id: string) => {
    history.push(datasourcesEditorIdURL({ datasourceId: id }));
  }, []);

  const location = useLocation();

  useEffect(() => {
    setCurrentSelectedDatasource(getSelectedDatasourceId(location.pathname));
  }, [location]);

  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
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

  return (
    <Flex
      borderRight="1px solid var(--ads-v2-color-border)"
      flexDirection="column"
      height="100%"
      width="100%"
    >
      <PaneHeader
        rightIcon={
          canCreateDatasource && datasources.length !== 0 ? (
            <CreateDatasourcePopover />
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
                      src={getAssetUrl(
                        groupedPlugins[data.pluginId].iconLocation,
                      )}
                    />
                  ),
                  description: get(dsUsageMap, data.id, ""),
                  descriptionType: "block",
                  className: "t--datasource",
                  isSelected: currentSelectedDatasource === data.id,
                  onClick: () => goToDatasource(data.id),
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

export default DataSidePane;
