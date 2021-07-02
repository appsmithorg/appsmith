import { Datasource } from "entities/Datasource";
import { isStoredDatasource } from "entities/Action";
import Button, { Category } from "components/ads/Button";
import React from "react";
import { isNil } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { Colors } from "constants/Colors";
import { useParams } from "react-router";
import CollapseComponent from "components/utils/CollapseComponent";
import {
  getPluginImages,
  getQueryActionsForCurrentPage,
} from "selectors/entitiesSelector";
import styled from "styled-components";
import { AppState } from "reducers";
import history from "utils/history";

import { renderDatasourceSection } from "pages/Editor/DataSourceEditor/DatasourceSection";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import { setDatsourceEditorMode } from "actions/datasourceActions";

const Wrapper = styled.div`
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

const EditDatasourceButton = styled(Button)`
  padding: 10px 20px;
  &&&& {
    height: 36px;
    max-width: 160px;
    border: 1px solid ${Colors.HIT_GRAY};
    width: auto;
  }
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

const DatasourceInfo = styled.div`
  padding: 0 10px;
`;

const Queries = styled.div`
  color: ${Colors.DOVE_GRAY};
  font-size: 14px;
  display: inline-block;
  margin-top: 11px;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  gap: 10px;
`;

type DatasourceCardProps = {
  datasource: Datasource;
  onCreateQuery: (datasource: Datasource) => void;
};

function DatasourceCard(props: DatasourceCardProps) {
  const dispatch = useDispatch();
  const pluginImages = useSelector(getPluginImages);
  const params = useParams<{ applicationId: string; pageId: string }>();
  const { datasource } = props;
  const datasourceFormConfigs = useSelector(
    (state: AppState) => state.entities.plugins.formConfigs,
  );
  const queryActions = useSelector(getQueryActionsForCurrentPage);
  const queriesWithThisDatasource = queryActions.filter(
    (action) =>
      isStoredDatasource(action.config.datasource) &&
      action.config.datasource.id === datasource.id,
  ).length;

  const currentFormConfig: Array<any> =
    datasourceFormConfigs[datasource?.pluginId ?? ""];
  const QUERY = queriesWithThisDatasource > 1 ? "queries" : "query";
  const editDatasource = () => {
    dispatch(setDatsourceEditorMode({ id: datasource.id, viewMode: false }));
    history.push(
      DATA_SOURCES_EDITOR_ID_URL(
        params.applicationId,
        params.pageId,
        datasource.id,
        {
          from: "datasources",
        },
      ),
    );
  };

  return (
    <Wrapper className="t--datasource">
      <DatasourceCardHeader className="t--datasource-name">
        <div style={{ flex: 1 }}>
          <DatasourceNameWrapper>
            <DatasourceImage
              alt="Datasource"
              className="dataSourceImage"
              src={pluginImages[datasource.pluginId]}
            />
            <DatasourceName>{datasource.name}</DatasourceName>
          </DatasourceNameWrapper>
          <Queries>
            {queriesWithThisDatasource
              ? `${queriesWithThisDatasource} ${QUERY} on this page`
              : "No query is using this datasource"}
          </Queries>
        </div>
        <ButtonsWrapper className="action-wrapper">
          <EditDatasourceButton
            category={Category.tertiary}
            className="t--edit-datasource"
            onClick={editDatasource}
            text="Edit"
          />
          <ActionButton
            className="t--create-query"
            onClick={() => props.onCreateQuery(datasource)}
            text="New Query"
          />
        </ButtonsWrapper>
      </DatasourceCardHeader>
      {!isNil(currentFormConfig) && (
        <CollapseComponent title="Show More">
          <DatasourceInfo>
            {renderDatasourceSection(currentFormConfig[0], datasource)}
          </DatasourceInfo>
        </CollapseComponent>
      )}
    </Wrapper>
  );
}

export default DatasourceCard;
