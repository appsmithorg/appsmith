import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { AppState } from "reducers";
import { isNil } from "lodash";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import { getDatasource, getPlugin } from "selectors/entitiesSelector";
import { Colors } from "constants/Colors";
import { HeaderIcons } from "icons/HeaderIcons";
import history from "utils/history";
import styled from "styled-components";
import { createActionRequest } from "actions/actionActions";
import {
  API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
} from "constants/routes";
import { createNewApiName, createNewQueryName } from "utils/AppsmithUtils";
import { getCurrentPageId } from "selectors/editorSelectors";
import { DEFAULT_API_ACTION } from "constants/ApiEditorConstants";
import { ApiActionConfig, PluginType } from "entities/Action";
import { renderDatasourceSection } from "./DatasourceSection";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

const ConnectedText = styled.div`
  color: ${Colors.GREEN};
  font-size: 17px;
  font-weight: bold;
  display: flex;
  align-items: center;
`;

const Header = styled.div`
  flex-direction: row;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid #d0d7dd;
  border-bottom: 1px solid #d0d7dd;
  padding-top: 24px;
  padding-bottom: 24px;
  margin-top: 18px;
`;

const ActionButton = styled(BaseButton)`
  &&& {
    max-width: 140px;
    align-self: center;
  }
`;

const Connected = () => {
  const params = useParams<{ datasourceId: string; applicationId: string }>();
  const datasource = useSelector((state: AppState) =>
    getDatasource(state, params.datasourceId),
  );
  const dispatch = useDispatch();
  const actions = useSelector((state: AppState) => state.entities.actions);
  const currentPageId = useSelector(getCurrentPageId);
  const datasourceFormConfigs = useSelector(
    (state: AppState) => state.entities.plugins.formConfigs,
  );
  const plugin = useSelector((state: AppState) =>
    getPlugin(state, datasource?.pluginId ?? ""),
  );
  const isDBDatasource = plugin?.type === PluginType.DB;

  const createQueryAction = useCallback(() => {
    const newQueryName = createNewQueryName(actions, currentPageId || "");

    dispatch(
      createActionRequest({
        name: newQueryName,
        pageId: currentPageId,
        pluginId: datasource?.pluginId,
        datasource: {
          id: datasource?.id,
        },
        actionConfiguration: {},
        eventData: {
          actionType: "Query",
          from: "datasource-pane",
        },
      }),
    );
    history.push(
      QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID(
        params.applicationId,
        currentPageId,
        currentPageId,
      ),
    );
  }, [dispatch, actions, currentPageId, params.applicationId, datasource]);

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
      Toaster.show({
        text: "Unable to create API. Try adding a url to the datasource",
        variant: Variant.danger,
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
          from: "datasource-pane",
        },
        actionConfiguration: {
          ...defaultAction,
        },
      }),
    );
    history.push(
      API_EDITOR_URL_WITH_SELECTED_PAGE_ID(
        params.applicationId,
        currentPageId,
        currentPageId,
      ),
    );
  }, [dispatch, actions, currentPageId, params.applicationId, datasource]);
  const currentFormConfig: Array<any> =
    datasourceFormConfigs[datasource?.pluginId ?? ""];

  return (
    <Wrapper>
      <Header>
        <ConnectedText>
          <HeaderIcons.SAVE_SUCCESS
            color={Colors.GREEN}
            height={30}
            width={30}
          />
          <div style={{ marginLeft: "12px" }}>Datasource Saved</div>
        </ConnectedText>
        <ActionButton
          className="t--create-query"
          icon={"plus"}
          text={isDBDatasource ? "New Query" : "New API"}
          filled
          accent="primary"
          onClick={isDBDatasource ? createQueryAction : createApiAction}
        />
      </Header>
      <div style={{ marginTop: "30px" }}>
        {!isNil(currentFormConfig)
          ? renderDatasourceSection(currentFormConfig[0], datasource)
          : undefined}
      </div>
    </Wrapper>
  );
};

export default Connected;
