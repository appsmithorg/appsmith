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
import { DEFAULT_API_ACTION_CONFIG } from "constants/ApiEditorConstants";
import { ApiActionConfig, PluginType, QueryAction } from "entities/Action";
import { renderDatasourceSection } from "./DatasourceSection";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { OnboardingStep } from "constants/OnboardingConstants";
import { inOnboarding } from "sagas/OnboardingSagas";
import OnboardingIndicator from "components/editorComponents/Onboarding/Indicator";
import { createMessage, ERROR_ADD_API_INVALID_URL } from "constants/messages";

const ConnectedText = styled.div`
  color: ${Colors.OXFORD_BLUE};
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
  &&&& {
    width: auto;
    align-self: center;
  }
`;

const Connected = () => {
  const params = useParams<{ datasourceId: string; applicationId: string }>();
  const datasource = useSelector((state: AppState) =>
    getDatasource(state, params.datasourceId),
  );

  // Onboarding
  const isInOnboarding = useSelector(inOnboarding);

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
    let payload = {
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
    } as Partial<QueryAction>; // TODO: refactor later. Handle case for undefined datasource before we reach here.
    if (datasource)
      if (isInOnboarding) {
        // If in onboarding and tooltip is being shown
        payload = Object.assign({}, payload, {
          name: "fetch_standup_updates",
          actionConfiguration: {
            body:
              "Select avatar, name, notes from standup_updates order by id desc",
          },
        });
      }

    dispatch(createActionRequest(payload));
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
    const defaultApiActionConfig: ApiActionConfig = {
      ...DEFAULT_API_ACTION_CONFIG,
      headers: headers.length ? headers : DEFAULT_API_ACTION_CONFIG.headers,
    };

    if (!datasource?.datasourceConfiguration?.url) {
      Toaster.show({
        text: createMessage(ERROR_ADD_API_INVALID_URL),
        variant: Variant.danger,
      });

      return;
    }

    dispatch(
      createActionRequest({
        name: newApiName,
        pageId: currentPageId,
        pluginId: datasource.pluginId,
        datasource: {
          id: datasource.id,
        },
        eventData: {
          actionType: "API",
          from: "datasource-pane",
        },
        actionConfiguration: defaultApiActionConfig,
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

          <div style={{ marginLeft: "12px" }}>Datasource Connected</div>
        </ConnectedText>

        <OnboardingIndicator step={OnboardingStep.EXAMPLE_DATABASE} width={120}>
          <ActionButton
            className="t--create-query"
            icon={"plus"}
            text={isDBDatasource ? "New Query" : "New API"}
            filled
            accent="primary"
            onClick={isDBDatasource ? createQueryAction : createApiAction}
          />
        </OnboardingIndicator>
      </Header>
      <div style={{ marginTop: "30px" }}>
        {!isNil(currentFormConfig) && !isNil(datasource)
          ? renderDatasourceSection(currentFormConfig[0], datasource)
          : undefined}
      </div>
    </Wrapper>
  );
};

export default Connected;
