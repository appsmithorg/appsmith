import { Datasource } from "api/DatasourcesApi";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import React from "react";
import { isNil } from "lodash";
import { useSelector } from "react-redux";
import { Colors } from "constants/Colors";
import {
  getPluginImages,
  getQueryActionsForCurrentPage,
} from "selectors/entitiesSelector";
import styled from "styled-components";
import { AppState } from "reducers";

import { renderDatasourceSection } from "pages/Editor/DataSourceEditor/DatasourceSection";

const Wrapper = styled.div`
  border: 2px solid #d6d6d6;
  padding: 18px;
  margin-top: 18px;
`;

const ActionButton = styled(BaseButton)`
  &&& {
    max-width: 120px;
    min-height: 36px;
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

const Queries = styled.div`
  color: ${Colors.DOVE_GRAY};
  font-size: 14px;
  display: inline-block;
  margin-top: 11px;
`;

type DatasourceCardProps = {
  datasource: Datasource;
  onCreateQuery: (datasource: Datasource) => void;
};

const DatasourceCard = (props: DatasourceCardProps) => {
  const pluginImages = useSelector(getPluginImages);
  const { datasource } = props;
  const datasourceFormConfigs = useSelector(
    (state: AppState) => state.entities.plugins.formConfigs,
  );
  const queryActions = useSelector(getQueryActionsForCurrentPage);
  const queriesWithThisDatasource = queryActions.filter(
    action => action.config.datasource.id === datasource.id,
  ).length;

  const currentFormConfig: Array<any> =
    datasourceFormConfigs[datasource?.pluginId ?? ""];
  const QUERY = queriesWithThisDatasource > 1 ? "queries" : "query";

  return (
    <Wrapper>
      <DatasourceCardHeader className="t--datasource-name">
        <div>
          <DatasourceNameWrapper>
            <DatasourceImage
              src={pluginImages[datasource.pluginId]}
              className="dataSourceImage"
              alt="Datasource"
            />
            <DatasourceName>{datasource.name}</DatasourceName>
          </DatasourceNameWrapper>
          <Queries>
            {queriesWithThisDatasource
              ? `${queriesWithThisDatasource} ${QUERY} on this page`
              : "No query is using this datasource"}
          </Queries>
        </div>
        <ActionButton
          className="t--create-query"
          icon={"plus"}
          text="New Query"
          filled
          accent="primary"
          onClick={() => props.onCreateQuery(datasource)}
        />
      </DatasourceCardHeader>
      {!isNil(currentFormConfig)
        ? renderDatasourceSection(currentFormConfig[0], datasource)
        : undefined}
    </Wrapper>
  );
};

export default DatasourceCard;
