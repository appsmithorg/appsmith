import type { Datasource } from "entities/Datasource";
import { isStoredDatasource } from "entities/Action";
import React from "react";
import { isEmpty } from "lodash";
import { useSelector } from "react-redux";
import { Colors } from "constants/Colors";
import { useParams } from "react-router";

import {
  getCurrentActions,
  getPluginImages,
} from "ee/selectors/entitiesSelector";
import styled from "styled-components";
import type { AppState } from "ee/reducers";
import history from "utils/history";

import RenderDatasourceInformation from "pages/Editor/DataSourceEditor/DatasourceSection";
import { BaseButton } from "components/designSystems/appsmith/BaseButton";
import { saasEditorDatasourceIdURL } from "ee/RouteBuilder";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { Button } from "@appsmith/ads";

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

const EditDatasourceButton = styled(Button)`
  &&&& {
    height: 36px;
    max-width: 160px;
    border: 1px solid var(--ads-v2-color-border);
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

interface DatasourceCardProps {
  datasource: Datasource;
  onCreate: (datasource: Datasource) => void;
}

// TODO: This is largely a quick copy pasta and edit of QueryEditor/DatasourceCard.tsx
// When we move Google Sheets over to regular oauth2 integrations, we will need to refactor this.
function DatasourceCard(props: DatasourceCardProps) {
  const pluginImages = useSelector(getPluginImages);
  const params = useParams<{
    pageId: string;
    pluginPackageName: string;
  }>();
  const { datasource } = props;
  const datasourceFormConfigs = useSelector(
    (state: AppState) => state.entities.plugins.formConfigs,
  );
  const queryActions = useSelector(getCurrentActions);
  const queriesWithThisDatasource = queryActions.filter(
    (action) =>
      isStoredDatasource(action.config.datasource) &&
      action.config.datasource.id === datasource.id,
  ).length;

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentFormConfig: Array<any> =
    datasourceFormConfigs[datasource?.pluginId ?? ""];
  const QUERY = queriesWithThisDatasource > 1 ? "APIs" : "API";

  const editDatasource = () => {
    history.push(
      saasEditorDatasourceIdURL({
        ...params,
        datasourceId: datasource.id,
      }),
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
              src={getAssetUrl(pluginImages[datasource.pluginId])}
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
            onClick={editDatasource}
            startIcon={"pencil-line"}
          >
            Edit Datasource
          </EditDatasourceButton>
          <ActionButton
            buttonStyle="PRIMARY"
            className="t--create-api"
            icon={"plus"}
            onClick={() => props.onCreate(datasource)}
            text="New API"
          />
        </ButtonsWrapper>
      </DatasourceCardHeader>
      {!isEmpty(currentFormConfig) ? (
        <RenderDatasourceInformation
          config={currentFormConfig[0]}
          datasource={datasource}
          showOnlyCurrentEnv
        />
      ) : undefined}
    </Wrapper>
  );
}

export default DatasourceCard;
