import React from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { MockDatasource } from "entities/Datasource";
import { getPluginImages } from "selectors/entitiesSelector";
import { Colors } from "constants/Colors";
import { addMockDatasourceToOrg } from "actions/datasourceActions";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { getQueryParams } from "../../../utils/AppsmithUtils";
import { AppState } from "../../../reducers";
import AnalyticsUtil from "../../../utils/AnalyticsUtil";

const MockDataSourceWrapper = styled.div`
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  flex: 1;

  .sectionHeader {
    font-weight: ${(props) => props.theme.fontWeights[2]};
    font-size: ${(props) => props.theme.fontSizes[4]}px;
    margin-top: 10px;
  }
`;

const Description = styled.div`
  color: ${Colors.DOVE_GRAY};
  font-size: 14px;
  display: inline-block;
  margin-top: 11px;
`;
function MockDataSources(props: { mockDatasources: MockDatasource[] }) {
  const orgId = useSelector(getCurrentOrgId);
  return (
    <MockDataSourceWrapper className="t--mock-datasource-list">
      {props.mockDatasources.map((datasource: MockDatasource, idx) => {
        return (
          <MockDatasourceCard
            datasource={datasource}
            key={`${datasource.name}_${datasource.packageName}_${idx}`}
            orgId={orgId}
          />
        );
      })}
    </MockDataSourceWrapper>
  );
}

export default MockDataSources;

const CardWrapper = styled.div`
  padding: 18px;
  /* margin-top: 18px; */

  &:hover {
    background: ${Colors.Gallery};
    cursor: pointer;
    .bp3-collapse-body {
      background: ${Colors.Gallery};
    }
  }
`;

const DatasourceImage = styled.img`
  height: 24px;
  width: auto;
`;

const DatasourceName = styled.span`
  margin-left: 10px;
  font-size: 16px;
  font-weight: 500;
`;

const DatasourceCardHeader = styled.div`
  justify-content: space-between;
  display: flex;
`;

const DatasourceNameWrapper = styled.div`
  flex-direction: row;
  align-items: center;
  display: flex;
`;

type MockDatasourceCardProps = {
  datasource: MockDatasource;
  orgId: string;
};

function MockDatasourceCard(props: MockDatasourceCardProps) {
  const { datasource, orgId } = props;
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
      orgId,
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
      addMockDatasourceToOrg(
        datasource.name,
        orgId,
        currentPlugin.id,
        currentPlugin.packageName,
        queryParams.isGeneratePageMode,
      ),
    );
  };

  return (
    <CardWrapper className="t--mock-datasource" onClick={addMockDataSource}>
      <DatasourceCardHeader className="t--datasource-name">
        <div style={{ flex: 1 }}>
          <DatasourceNameWrapper>
            <DatasourceImage
              alt="Datasource"
              className="dataSourceImage"
              src={pluginImages[currentPlugin.id]}
            />
            <DatasourceName>{datasource.name}</DatasourceName>
          </DatasourceNameWrapper>
          <Description>{datasource.description}</Description>
        </div>
      </DatasourceCardHeader>
    </CardWrapper>
  );
}
