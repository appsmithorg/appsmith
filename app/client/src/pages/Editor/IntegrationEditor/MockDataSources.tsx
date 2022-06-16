import React from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { MockDatasource } from "entities/Datasource";
import { getPluginImages } from "selectors/entitiesSelector";
import { Colors } from "constants/Colors";
import { addMockDatasourceToWorkspace } from "actions/datasourceActions";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { getQueryParams } from "utils/AppsmithUtils";
import { AppState } from "reducers";
import AnalyticsUtil from "utils/AnalyticsUtil";

const MockDataSourceWrapper = styled.div`
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  min-width: 150px;
  border-radius: 4px;
  align-items: center;
  margin-top: 8px;
`;

const Description = styled.div`
  color: ${Colors.GREY_8};
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
  &:hover {
    background-color: ${Colors.GREY_1};
    cursor: pointer;
  }
  }
`;

const DatasourceImage = styled.img`
  height: 28px;
  width: auto;
  margin: 0 auto;
  max-width: 100%;
`;

const DatasourceName = styled.span`
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: -0.24px;
  color: ${Colors.BLACK};
`;

const DatasourceCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  padding-left: 13.5px;
`;

const DatasourceIconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${Colors.GREY_2};
  display: flex;
  align-items: center;
`;

const DatasourceNameWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

type MockDatasourceCardProps = {
  datasource: MockDatasource;
  workspaceId: string;
};

function MockDatasourceCard(props: MockDatasourceCardProps) {
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
        <DatasourceIconWrapper data-testid="mock-datasource-icon-wrapper">
          <DatasourceImage
            alt="Datasource"
            data-testid="mock-datasource-image"
            src={pluginImages[currentPlugin.id]}
          />
        </DatasourceIconWrapper>
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
