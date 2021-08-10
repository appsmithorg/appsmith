import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { AppState } from "reducers";
import { isNil } from "lodash";
import Button from "components/ads/Button";
import { getDatasource, getPlugin } from "selectors/entitiesSelector";
import { Colors } from "constants/Colors";
import { HeaderIcons } from "icons/HeaderIcons";
import styled from "styled-components";
import { createActionRequest } from "actions/pluginActionActions";
import { createNewQueryName } from "utils/AppsmithUtils";
import { getCurrentPageId } from "selectors/editorSelectors";
import { ApiActionConfig, Action } from "entities/Action";
import { renderDatasourceSection } from "./DatasourceSection";
import { OnboardingStep } from "constants/OnboardingConstants";
import { inOnboarding } from "sagas/OnboardingSagas";
import OnboardingIndicator from "components/editorComponents/Onboarding/Indicator";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { ERROR_ADD_API_INVALID_URL } from "constants/messages";
import { DEFAULT_API_ACTION_CONFIG } from "constants/ApiEditorConstants";

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

const ActionButton = styled(Button)`
  padding: 10px 20px;
  &&&& {
    height: 36px;
    //max-width: 120px;
    width: auto;
  }
  span > svg > path {
    stroke: white;
  }
`;

function Connected() {
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

  const createQueryAction = useCallback(() => {
    const newQueryName = createNewQueryName(actions, currentPageId || "");

    if (
      plugin?.type === "API" &&
      (!datasource ||
        !datasource.datasourceConfiguration ||
        !datasource.datasourceConfiguration.url)
    ) {
      Toaster.show({
        text: ERROR_ADD_API_INVALID_URL(),
        variant: Variant.danger,
      });
      return;
    }

    const headers = datasource?.datasourceConfiguration?.headers ?? [];
    const defaultApiActionConfig: ApiActionConfig = {
      ...DEFAULT_API_ACTION_CONFIG,
      headers: headers.length ? headers : DEFAULT_API_ACTION_CONFIG.headers,
    };
    let payload = {
      name: newQueryName,
      pageId: currentPageId,
      pluginId: datasource?.pluginId,
      datasource: {
        id: datasource?.id,
      },
      actionConfiguration: plugin?.type === "API" ? defaultApiActionConfig : {},
      eventData: {
        actionType: "Query",
        from: "datasource-pane",
      },
    } as Partial<Action>;

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
            icon="plus"
            onClick={createQueryAction}
            text={"New Query"}
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
}

export default Connected;
