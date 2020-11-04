import { Datasource } from "api/DatasourcesApi";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import React, { useCallback } from "react";
import { isNil } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { Colors } from "constants/Colors";
import { useParams } from "react-router";
import {
  getPluginImages,
  getApiActionsForCurrentPage,
} from "selectors/entitiesSelector";
import styled from "styled-components";
import { AppState } from "reducers";
import history from "utils/history";

import { renderDatasourceSection } from "pages/Editor/DataSourceEditor/DatasourceSection";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import { setDatsourceEditorMode } from "actions/datasourceActions";
import { createActionRequest } from "actions/actionActions";
import { AppToaster } from "components/editorComponents/ToastComponent";
import { DEFAULT_API_ACTION } from "constants/ApiEditorConstants";
import { ApiActionConfig } from "entities/Action";
import { createNewApiName } from "utils/AppsmithUtils";
import { getCurrentPageId } from "selectors/editorSelectors";

const Wrapper = styled.div`
  border: 2px solid #d6d6d6;
  padding: 18px;
  margin-top: 18px;
`;

const ActionButton = styled(BaseButton)`
  &&&& {
    height: 36px;
    max-width: 120px;
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
  flex-direction: row;
  display: inline-flex;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
`;

type DatasourceCardProps = {
  datasource: Datasource;
};

const DatasourceCard = (props: DatasourceCardProps) => {
  const dispatch = useDispatch();
  const pluginImages = useSelector(getPluginImages);
  const actions = useSelector((state: AppState) => state.entities.actions);
  const currentPageId = useSelector(getCurrentPageId);
  const params = useParams<{ applicationId: string; pageId: string }>();
  const { datasource } = props;
  const datasourceFormConfigs = useSelector(
    (state: AppState) => state.entities.plugins.formConfigs,
  );
  const apiActions = useSelector(getApiActionsForCurrentPage);
  const apisWithThisDatasource = apiActions.filter(
    action => action.config.datasource.id === datasource.id,
  ).length;

  const currentFormConfig: Array<any> =
    datasourceFormConfigs[datasource?.pluginId ?? ""];
  const API = apisWithThisDatasource > 1 ? "apis" : "api";

  const editDatasource = () => {
    dispatch(setDatsourceEditorMode({ id: datasource.id, viewMode: false }));
    history.push(
      DATA_SOURCES_EDITOR_ID_URL(
        params.applicationId,
        params.pageId,
        datasource.id,
      ),
    );
  };

  const createApiAction = useCallback(() => {
    const newApiName = createNewApiName(actions, currentPageId || "");
    const headers = datasource?.datasourceConfiguration?.headers ?? [];
    const defaultAction: Partial<ApiActionConfig> | undefined = {
      ...DEFAULT_API_ACTION.actionConfiguration,
      headers: headers.length
        ? headers
        : DEFAULT_API_ACTION.actionConfiguration?.headers,
    };

    if (!datasource?.datasourceConfiguration?.url) {
      AppToaster.show({
        message: "Unable to create API. Try adding a url to the datasource",
        type: "error",
      });

      return;
    }

    dispatch(
      createActionRequest({
        name: newApiName,
        pageId: currentPageId,
        pluginId: datasource?.pluginId,
        datasource: {
          id: datasource?.id,
        },
        eventData: {
          actionType: "API",
          from: "API_PANE",
        },
        actionConfiguration: {
          ...defaultAction,
        },
      }),
    );
  }, [dispatch, actions, currentPageId, datasource]);

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
            {apisWithThisDatasource
              ? `${apisWithThisDatasource} ${API} on this page`
              : "No api is using this datasource"}
          </Queries>
        </div>
        <ButtonsWrapper>
          <EditDatasourceButton
            className="t--edit-datasource"
            icon={"edit"}
            text="Edit Datasource"
            onClick={editDatasource}
          />
          <ActionButton
            className="t--create-api"
            icon={"plus"}
            text="New API"
            filled
            accent="primary"
            onClick={createApiAction}
          />
        </ButtonsWrapper>
      </DatasourceCardHeader>
      {!isNil(currentFormConfig)
        ? renderDatasourceSection(currentFormConfig[0], datasource)
        : undefined}
    </Wrapper>
  );
};

export default DatasourceCard;
