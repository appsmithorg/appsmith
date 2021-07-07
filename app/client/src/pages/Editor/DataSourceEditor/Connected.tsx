import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { AppState } from "reducers";
import { isNil } from "lodash";
import Button from "components/ads/Button";
import { getDatasource } from "selectors/entitiesSelector";
import { Colors } from "constants/Colors";
import { HeaderIcons } from "icons/HeaderIcons";
import styled from "styled-components";
import { createActionRequest } from "actions/actionActions";
import { createNewQueryName } from "utils/AppsmithUtils";
import { getCurrentPageId } from "selectors/editorSelectors";
import { QueryAction } from "entities/Action";
import { renderDatasourceSection } from "./DatasourceSection";
import { OnboardingStep } from "constants/OnboardingConstants";
import { inOnboarding } from "sagas/OnboardingSagas";
import OnboardingIndicator from "components/editorComponents/Onboarding/Indicator";

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
