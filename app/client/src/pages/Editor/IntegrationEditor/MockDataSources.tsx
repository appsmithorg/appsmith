import React, { useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { MockDatasource } from "entities/Datasource";
import { getPluginImages } from "selectors/entitiesSelector";
import { Colors } from "constants/Colors";
import { addMockDatasourceToOrg } from "actions/datasourceActions";
import { getCurrentOrgId } from "selectors/organizationSelectors";

const MockDataSourceWrapper = styled.div`
  padding: 5px;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
  /* height: calc(
    100vh - ${(props) => props.theme.integrationsPageUnusableHeight}
  ); */

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
      {props.mockDatasources.map((datasource: MockDatasource) => {
        return (
          <MockDatasourceCard
            datasource={datasource}
            key={datasource.id}
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
  const addMockDataSource = useCallback(
    () => dispatch(addMockDatasourceToOrg(datasource.id, orgId)),
    [datasource.id, orgId],
  );
  return (
    <CardWrapper className="t--mock-datasource" onClick={addMockDataSource}>
      <DatasourceCardHeader className="t--datasource-name">
        <div style={{ flex: 1 }}>
          <DatasourceNameWrapper>
            {datasource.pluginId && (
              <DatasourceImage
                alt="Datasource"
                className="dataSourceImage"
                src={pluginImages[datasource.pluginId]}
              />
            )}
            <DatasourceName>{datasource.name}</DatasourceName>
          </DatasourceNameWrapper>
          <Description>{datasource.description}</Description>
        </div>
      </DatasourceCardHeader>
    </CardWrapper>
  );
}
