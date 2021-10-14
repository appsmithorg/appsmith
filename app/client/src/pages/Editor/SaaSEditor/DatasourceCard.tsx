import { Datasource } from "entities/Datasource";
import { isStoredDatasource } from "entities/Action";
import React from "react";
import { isNil } from "lodash";
import { useSelector } from "react-redux";
import { Colors } from "constants/Colors";
import { useParams } from "react-router";

import {
  getActionsForCurrentPage,
  getPluginImages,
} from "selectors/entitiesSelector";
import styled from "styled-components";
import { AppState } from "reducers";
import history from "utils/history";

import { renderDatasourceSection } from "pages/Editor/DataSourceEditor/DatasourceSection";
import { SAAS_EDITOR_DATASOURCE_ID_URL } from "./constants";
import { BaseButton } from "components/designSystems/appsmith/BaseButton";
import { getCurrentApplicationId } from "selectors/editorSelectors";

const Wrapper = styled.div`
  border: 2px solid #d6d6d6;
  padding: 18px;
  margin-top: 18px;
`;

const ActionButton = styled(BaseButton)`
  &&&& {
    height: 36px;
    max-width: 120px;
    width: auto;
  }

  span > svg > path {
    stroke: white;
  }
`;

const DatasourceImage = styled.img`
  height: 24px;
  width: auto;
`;

const EditDatasourceButton = styled(BaseButton)`
  &&&& {
    height: 36px;
    max-width: 160px;
    border: 1px solid ${Colors.GEYSER_LIGHT};
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
  onCreate: (datasource: Datasource) => void;
};

// TODO: This is largely a quick copy pasta and edit of QueryEditor/DatasourceCard.tsx
// When we move Google Sheets over to regular oauth2 integrations, we will need to refactor this.
function DatasourceCard(props: DatasourceCardProps) {
  const pluginImages = useSelector(getPluginImages);
  const params = useParams<{
    pageId: string;
    pluginPackageName: string;
  }>();
  const { datasource } = props;
  const applicationId = useSelector(getCurrentApplicationId);
  const datasourceFormConfigs = useSelector(
    (state: AppState) => state.entities.plugins.formConfigs,
  );
  const queryActions = useSelector(getActionsForCurrentPage);
  const queriesWithThisDatasource = queryActions.filter(
    (action) =>
      isStoredDatasource(action.config.datasource) &&
      action.config.datasource.id === datasource.id,
  ).length;

  const currentFormConfig: Array<any> =
    datasourceFormConfigs[datasource?.pluginId ?? ""];
  const QUERY = queriesWithThisDatasource > 1 ? "APIs" : "API";

  const editDatasource = () => {
    history.push(
      SAAS_EDITOR_DATASOURCE_ID_URL(
        applicationId,
        params.pageId,
        params.pluginPackageName,
        datasource.id,
      ),
    );
  };

  return (
    <Wrapper>
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
              : "No API is using this datasource"}
          </Queries>
        </div>
        <ButtonsWrapper>
          <EditDatasourceButton
            className="t--edit-datasource"
            icon={"edit"}
            onClick={editDatasource}
            text="Edit Datasource"
          />
          <ActionButton
            buttonStyle="PRIMARY"
            className="t--create-api"
            icon={"plus"}
            onClick={() => props.onCreate(datasource)}
            text="New API"
          />
        </ButtonsWrapper>
      </DatasourceCardHeader>
      {!isNil(currentFormConfig)
        ? renderDatasourceSection(currentFormConfig[0], datasource)
        : undefined}
    </Wrapper>
  );
}

export default DatasourceCard;
