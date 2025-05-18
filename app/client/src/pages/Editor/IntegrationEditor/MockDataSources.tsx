import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { MockDatasource } from "entities/Datasource";
import { getPluginImages } from "ee/selectors/entitiesSelector";
import { addMockDatasourceToWorkspace } from "actions/datasourceActions";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { getQueryParams } from "utils/URLUtils";
import type { DefaultRootState } from "react-redux";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import {
  DatasourceContainer,
  DatasourceSection,
  DatasourceSectionHeading,
  StyledDivider,
} from "./IntegrationStyledComponents";
import DatasourceItem from "./DatasourceItem";
import {
  createMessage,
  SAMPLE_DATASOURCE_SUBHEADING,
  SAMPLE_DATASOURCES,
} from "ee/constants/messages";
import { pluginSearchSelector } from "./CreateNewDatasourceHeader";
import { Flex, Text } from "@appsmith/ads";
import { filterSearch } from "./util";

interface MockDatasourceCardProps {
  datasource: MockDatasource;
  workspaceId: string;
}

function MockDatasourceCard(props: MockDatasourceCardProps) {
  const { datasource, workspaceId } = props;
  const dispatch = useDispatch();
  const pluginImages = useSelector(getPluginImages);
  const plugins = useSelector((state: DefaultRootState) => {
    return state.entities.plugins.list;
  });
  const currentPlugin = plugins.find(
    (eachPlugin) => eachPlugin.packageName === datasource.packageName,
  );

  if (!currentPlugin) {
    return null;
  }

  const addMockDataSource = () => {
    AnalyticsUtil.logEvent("ADD_MOCK_DATASOURCE_CLICK", {
      datasourceName: datasource.name,
      workspaceId,
      packageName: currentPlugin.packageName,
      pluginName: currentPlugin.name,
      from: DatasourceCreateEntryPoints.CREATE_NEW_DATASOURCE,
    });

    AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
      mockDatasourceName: datasource.name,
      pluginName: currentPlugin.name,
      pluginPackageName: currentPlugin.packageName,
    });

    const queryParams = getQueryParams();

    dispatch(
      addMockDatasourceToWorkspace(
        datasource.name,
        workspaceId,
        currentPlugin.id,
        currentPlugin.packageName,
        queryParams.isGeneratePageMode,
      ),
    );
  };

  return (
    <DatasourceItem
      className="t--mock-datasource"
      dataCardDescriptionTestId="mockdatasource-description"
      dataCardImageTestId="mock-datasource-image"
      dataCardWrapperTestId="mock-datasource-name-wrapper"
      dataNameTestId="mockdatasource-name"
      description={datasource.description}
      handleOnClick={addMockDataSource}
      icon={getAssetUrl(pluginImages[currentPlugin.id])}
      name={datasource.name}
    />
  );
}

interface MockDataSourcesProps {
  mockDatasources: MockDatasource[];
  preDivider?: boolean;
  postDivider?: boolean;
}

export default function MockDataSources({
  mockDatasources,
  postDivider,
  preDivider,
}: MockDataSourcesProps) {
  const workspaceId = useSelector(getCurrentWorkspaceId);
  let searchedPlugin = useSelector((state) =>
    pluginSearchSelector(state, "search"),
  );

  searchedPlugin = (searchedPlugin || "").toLocaleLowerCase();

  const filteredDatasources = filterSearch(
    mockDatasources,
    searchedPlugin,
  ) as MockDatasource[];

  if (filteredDatasources.length === 0) return null;

  return (
    <>
      {preDivider && <StyledDivider />}
      <DatasourceSection id="mock-database">
        <Flex flexDirection="column">
          <DatasourceSectionHeading kind="heading-m">
            {createMessage(SAMPLE_DATASOURCES)}
          </DatasourceSectionHeading>
          <Text>{createMessage(SAMPLE_DATASOURCE_SUBHEADING)}</Text>
        </Flex>
        <DatasourceContainer className="t--mock-datasource-list">
          {filteredDatasources.map((datasource: MockDatasource, idx) => {
            return (
              <MockDatasourceCard
                datasource={datasource}
                key={`${datasource.name}_${datasource.packageName}_${idx}`}
                workspaceId={workspaceId}
              />
            );
          })}
        </DatasourceContainer>
      </DatasourceSection>
      {postDivider && <StyledDivider />}
    </>
  );
}
