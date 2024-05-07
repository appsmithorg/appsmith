import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Flex, List, Text } from "design-system";
import { useSelector } from "react-redux";
import {
  getCurrentPageId,
  getDatasourceUsageCountForApp,
  getDatasources,
  getDatasourcesGroupedByPluginCategory,
  getPlugins,
} from "@appsmith/selectors/entitiesSelector";
import history from "utils/history";
import {
  datasourcesEditorIdURL,
  integrationEditorURL,
} from "@appsmith/RouteBuilder";
import { getSelectedDatasourceId } from "@appsmith/navigation/FocusSelectors";
import { get, keyBy } from "lodash";
import CreateDatasourcePopover from "./CreateDatasourcePopover";
import { useLocation } from "react-router";
import {
  createMessage,
  DATA_PANE_TITLE,
  DATASOURCE_LIST_BLANK_DESCRIPTION,
} from "@appsmith/constants/messages";
import PaneHeader from "./PaneHeader";
import { useEditorType } from "@appsmith/hooks";
import { INTEGRATION_TABS } from "../../../../constants/routes";
import type { AppState } from "@appsmith/reducers";
import { getCurrentAppWorkspace } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasCreateDatasourcePermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { EmptyState } from "../EditorPane/components/EmptyState";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

const PaneContainer = styled.div`
  width: 300px;
`;

const PaneBody = styled.div`
  padding: var(--ads-v2-spaces-3) 0;
  height: calc(100vh - 120px);
  overflow-y: scroll;
`;

const DatasourceIcon = styled.img`
  height: 16px;
  width: 16px;
  align-self: flex-start;
`;

const StyledList = styled(List)`
  gap: 0;
`;

interface DataSidePaneProps {
  dsUsageSelector?: (...args: any[]) => Record<string, string>;
}

const DataSidePane = (props: DataSidePaneProps) => {
  const { dsUsageSelector = getDatasourceUsageCountForApp } = props;
  const editorType = useEditorType(history.location.pathname);
  const pageId = useSelector(getCurrentPageId) as string;
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

  const addButtonClickHandler = () =>
    history.push(
      integrationEditorURL({
        pageId: pageId,
        selectedTab: INTEGRATION_TABS.NEW,
      }),
    );

  return (
    <PaneContainer>
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
            buttonClassName={"t--add-datasource-button-blank-screen"}
            buttonText={"Bring your data"}
            description={createMessage(DATASOURCE_LIST_BLANK_DESCRIPTION)}
            icon={"datasource-v3"}
            onClick={canCreateDatasource ? addButtonClickHandler : undefined}
          />
        ) : null}
        <Flex
          flexDirection={"column"}
          gap="spaces-4"
          overflowY="auto"
          px="spaces-3"
        >
          {Object.entries(groupedDatasources).map(([key, value]) => (
            <Flex flexDirection={"column"} key={key}>
              <Flex px="spaces-3" py="spaces-1">
                <Text
                  className="overflow-hidden overflow-ellipsis whitespace-nowrap"
                  kind="body-s"
                >
                  {key}
                </Text>
              </Flex>
              <StyledList
                items={value.map((data) => ({
                  className: "t--datasource",
                  title: data.name,
                  onClick: () => goToDatasource(data.id),
                  description: get(dsUsageMap, data.id, ""),
                  descriptionType: "block",
                  isSelected: currentSelectedDatasource === data.id,
                  startIcon: (
                    <DatasourceIcon
                      src={getAssetUrl(
                        groupedPlugins[data.pluginId].iconLocation,
                      )}
                    />
                  ),
                }))}
              />
            </Flex>
          ))}
        </Flex>
      </PaneBody>
    </PaneContainer>
  );
};

export default DataSidePane;
