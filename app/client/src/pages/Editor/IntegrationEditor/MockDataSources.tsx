import React, { useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { MockDatasource } from "entities/Datasource";
import Button from "components/ads/Button";
import { getPluginImages } from "selectors/entitiesSelector";
import { Colors } from "constants/Colors";
import { addMockDatasourceToOrg } from "actions/datasourceActions";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { getQueryParams } from "../../../utils/AppsmithUtils";

const MockDataSourceWrapper = styled.div`
  padding: 5px;
  overflow: auto;
  display: flex;
  flex-direction: column;
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
    .bp3-collapse-body {
      background: ${Colors.Gallery};
    }
  }
`;

const ActionButton = styled(Button)`
  padding: 10px 20px;
  &&&& {
    height: 36px;
    max-width: 120px;
    width: auto;
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

const ButtonsWrapper = styled.div`
  display: flex;
  gap: 10px;
`;

type MockDatasourceCardProps = {
  datasource: MockDatasource;
  orgId: string;
};

function MockDatasourceCard(props: MockDatasourceCardProps) {
  const { datasource, orgId } = props;
  const dispatch = useDispatch();
  const pluginImages = useSelector(getPluginImages);
  const addMockDataSource = useCallback(() => {
    const queryParams = getQueryParams();
    dispatch(
      addMockDatasourceToOrg(datasource.id, orgId, queryParams.initiator),
    );
  }, [datasource.id, orgId]);
  return (
    <CardWrapper className="t--mock-datasource">
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
        <ButtonsWrapper className="action-wrapper">
          <ActionButton
            className="t--use-mock-db"
            onClick={addMockDataSource}
            text="Add"
          />
        </ButtonsWrapper>
      </DatasourceCardHeader>
    </CardWrapper>
  );
}
