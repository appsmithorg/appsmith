import React from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import type { MockDatasource } from "entities/Datasource";
import { getPluginImages } from "ee/selectors/entitiesSelector";
import { addMockDatasourceToWorkspace } from "actions/datasourceActions";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { getQueryParams } from "utils/URLUtils";
import type { AppState } from "ee/reducers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { DatasourceCreateEntryPoints } from "constants/Datasource";

const MockDataSourceWrapper = styled.div`
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  min-width: 150px;
  align-items: center;
  margin-top: 8px;
`;

const Description = styled.div`
  color: var(--ads-v2-color-fg-muted);
  font-size: 13px;
  font-weight: 400;
  line-height: 17px;
  letter-spacing: -0.24px;
`;

function MockDataSources(props: { mockDatasources: MockDatasource[] }) {
  const workspaceId = useSelector(getCurrentWorkspaceId);

  return (
    <MockDataSourceWrapper className="t--mock-datasource-list">
      {props.mockDatasources.map((datasource: MockDatasource, idx) => {
        return (
          <MockDatasourceCard
            datasource={datasource}
            key={`${datasource.name}_${datasource.packageName}_${idx}`}
            workspaceId={workspaceId}
          />
        );
      })}
    </MockDataSourceWrapper>
  );
}

export default MockDataSources;

const CardWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  border-radius: var(--ads-v2-border-radius);
  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);
    cursor: pointer;
  }
`;

const DatasourceImage = styled.img`
  height: 34px;
  width: auto;
  margin: 0 auto;
  max-width: 100%;
`;

const DatasourceName = styled.span`
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: -0.24px;
  color: var(--ads-v2-color-fg);
`;

const DatasourceCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  padding-left: 13.5px;
`;

const DatasourceNameWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

interface MockDatasourceCardProps {
  datasource: MockDatasource;
  workspaceId: string;
}

export function MockDatasourceCard(props: MockDatasourceCardProps) {
  const { datasource, workspaceId } = props;
  const dispatch = useDispatch();
  const pluginImages = useSelector(getPluginImages);
  const plugins = useSelector((state: AppState) => {
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
    <CardWrapper className="t--mock-datasource" onClick={addMockDataSource}>
      <DatasourceCardHeader className="t--datasource-name">
        <DatasourceImage
          alt="Datasource"
          data-testid="mock-datasource-image"
          src={getAssetUrl(pluginImages[currentPlugin.id])}
        />
        <DatasourceNameWrapper data-testid="mock-datasource-name-wrapper">
          <DatasourceName data-testid="mockdatasource-name">
            {datasource.name}
          </DatasourceName>
          <Description data-testid="mockdatasource-description">
            {datasource.description}
          </Description>
        </DatasourceNameWrapper>
      </DatasourceCardHeader>
    </CardWrapper>
  );
}
