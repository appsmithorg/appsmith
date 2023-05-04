import React from "react";
import { Text, TextType } from "design-system-old";
import { Button, Icon, Link } from "design-system";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  getCanvasWidgets,
  getDatasources,
  getPageActions,
} from "selectors/entitiesSelector";
import { useIsWidgetActionConnectionPresent } from "pages/Editor/utils";
import { getEvaluationInverseDependencyMap } from "selectors/dataTreeSelectors";
import { APPLICATIONS_URL, INTEGRATION_TABS } from "constants/routes";
import {
  getApplicationLastDeployedAt,
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import history from "utils/history";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  getFirstTimeUserOnboardingComplete,
  getIsFirstTimeUserOnboardingEnabled,
} from "selectors/onboardingSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { bindDataOnCanvas } from "actions/pluginActionActions";
import { Redirect } from "react-router";
import {
  ONBOARDING_CHECKLIST_ACTIONS,
  ONBOARDING_CHECKLIST_BANNER_BODY,
  ONBOARDING_CHECKLIST_BANNER_HEADER,
  ONBOARDING_CHECKLIST_HEADER,
  ONBOARDING_CHECKLIST_BODY,
  ONBOARDING_CHECKLIST_COMPLETE_TEXT,
  ONBOARDING_CHECKLIST_CONNECT_DATA_SOURCE,
  ONBOARDING_CHECKLIST_CREATE_A_QUERY,
  ONBOARDING_CHECKLIST_ADD_WIDGETS,
  ONBOARDING_CHECKLIST_CONNECT_DATA_TO_WIDGET,
  ONBOARDING_CHECKLIST_DEPLOY_APPLICATIONS,
  ONBOARDING_CHECKLIST_FOOTER,
  ONBOARDING_CHECKLIST_BANNER_BUTTON,
  createMessage,
} from "@appsmith/constants/messages";
import type { Datasource } from "entities/Datasource";
import type { ActionDataState } from "reducers/entityReducers/actionsReducer";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { triggerWelcomeTour } from "./Utils";
import { builderURL, integrationEditorURL } from "RouteBuilder";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";

const Wrapper = styled.div`
  padding: var(--ads-v2-spaces-7);
  background: #fff;
  height: calc(100vh - ${(props) => props.theme.smallHeaderHeight});
  overflow: auto;
`;

const Pageheader = styled.h4`
  font-size: ${(props) => props.theme.fontSizes[6]}px;
`;

const PageSubHeader = styled.p`
  width: 100%;
  margin-bottom: ${(props) => props.theme.spaces[12]}px;
`;

const StatusWrapper = styled.p`
  width: 100%;
  margin-bottom: ${(props) => props.theme.spaces[12]}px;
  & span {
    font-weight: 700;
  }
`;

const StyledList = styled.ul`
  margin: 0;
  padding: 0;
  list-style-type: none;
  overflow: auto;
`;

const StyledListItem = styled.li`
  width: 100%;
  display: flex;
  padding: var(--ads-v2-spaces-7) 0px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--ads-v2-color-border);
  &:first-child {
    border-top: 1px solid var(--ads-v2-color-border);
  }
`;
const StyledListItemTextWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;
const CHECKLIST_WIDTH_OFFSET = 268;

const ChecklistText = styled.div<{ active: boolean }>`
  flex-basis: calc(100% - ${CHECKLIST_WIDTH_OFFSET}px);
  & span {
    font-weight: 700;
  }
`;

const StyledCompleteMarker = styled.div`
  flex-basis: 40px;
`;

const Banner = styled.div`
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid var(--ads-v2-color-border);
  padding: var(--ads-v2-spaces-5);
  margin-top: var(--ads-v2-spaces-7);
`;

const BannerHeader = styled.h5`
  font-size: 20px;
  margin: 0;
`;

const BannerText = styled.p`
  margin: ${(props) => props.theme.spaces[3]}px 0px
    ${(props) => props.theme.spaces[7]}px;
`;

const StyledFooter = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-top: ${(props) => props.theme.spaces[9]}px;
  margin-bottom: ${(props) => props.theme.spaces[9]}px;
`;

function getSuggestedNextActionAndCompletedTasks(
  datasources: Datasource[],
  actions: ActionDataState,
  widgets: CanvasWidgetsReduxState,
  isConnectionPresent: boolean,
  isDeployed: boolean,
) {
  let suggestedNextAction;
  if (!datasources.length) {
    suggestedNextAction = createMessage(
      () => ONBOARDING_CHECKLIST_ACTIONS.CONNECT_A_DATASOURCE,
    );
  } else if (!actions.length) {
    suggestedNextAction = createMessage(
      () => ONBOARDING_CHECKLIST_ACTIONS.CREATE_A_QUERY,
    );
  } else if (Object.keys(widgets).length === 1) {
    suggestedNextAction = createMessage(
      () => ONBOARDING_CHECKLIST_ACTIONS.ADD_WIDGETS,
    );
  } else if (!isConnectionPresent) {
    suggestedNextAction = createMessage(
      () => ONBOARDING_CHECKLIST_ACTIONS.CONNECT_DATA_TO_WIDGET,
    );
  } else if (!isDeployed) {
    suggestedNextAction = createMessage(
      () => ONBOARDING_CHECKLIST_ACTIONS.DEPLOY_APPLICATIONS,
    );
  }
  let completedTasks = 0;

  if (datasources.length) {
    completedTasks++;
  }
  if (actions.length) {
    completedTasks++;
  }
  if (Object.keys(widgets).length > 1) {
    completedTasks++;
  }
  if (isConnectionPresent) {
    completedTasks++;
  }
  if (isDeployed) {
    completedTasks++;
  }

  return { suggestedNextAction, completedTasks };
}

export default function OnboardingChecklist() {
  const isAirgappedInstance = isAirgapped();
  const dispatch = useDispatch();
  const datasources = useSelector(getDatasources);
  const pageId = useSelector(getCurrentPageId);
  const actions = useSelector(getPageActions(pageId));
  const widgets = useSelector(getCanvasWidgets);
  const deps = useSelector(getEvaluationInverseDependencyMap);
  const isConnectionPresent = useIsWidgetActionConnectionPresent(
    widgets,
    actions,
    deps,
  );
  // const theme = useSelector(getCurrentThemeDetails);
  const applicationId = useSelector(getCurrentApplicationId);
  const isDeployed = !!useSelector(getApplicationLastDeployedAt);
  const isCompleted = useSelector(getFirstTimeUserOnboardingComplete);
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  if (!isFirstTimeUserOnboardingEnabled && !isCompleted) {
    return <Redirect to={builderURL({ pageId })} />;
  }
  const { completedTasks, suggestedNextAction } =
    getSuggestedNextActionAndCompletedTasks(
      datasources,
      actions,
      widgets,
      isConnectionPresent,
      isDeployed,
    );
  const onconnectYourWidget = () => {
    const action = actions[0];
    if (action && applicationId && pageId) {
      dispatch(
        bindDataOnCanvas({
          queryId: action.config.id,
          applicationId,
          pageId,
        }),
      );
    } else {
      history.push(builderURL({ pageId }));
    }
    AnalyticsUtil.logEvent("SIGNPOSTING_CONNECT_WIDGET_CLICK");
  };
  return (
    <Wrapper data-testid="checklist-wrapper">
      <Link
        className="t--checklist-back"
        onClick={() => history.push(builderURL({ pageId }))}
        startIcon="back-control"
      >
        Back
      </Link>
      {isCompleted && (
        <Banner data-testid="checklist-completion-banner">
          <BannerHeader>
            {createMessage(ONBOARDING_CHECKLIST_BANNER_HEADER)}
          </BannerHeader>
          <BannerText>
            {createMessage(ONBOARDING_CHECKLIST_BANNER_BODY)}
          </BannerText>
          <Button onClick={() => history.push(APPLICATIONS_URL)} size="md">
            {createMessage(ONBOARDING_CHECKLIST_BANNER_BUTTON)}
          </Button>
        </Banner>
      )}
      <Pageheader className="font-bold py-6">
        {createMessage(ONBOARDING_CHECKLIST_HEADER)}
      </Pageheader>
      <PageSubHeader>{createMessage(ONBOARDING_CHECKLIST_BODY)}</PageSubHeader>
      <StatusWrapper>
        <span
          className="t--checklist-complete-status"
          data-testid="checklist-completion-info"
        >
          {completedTasks} of 5
        </span>
        &nbsp;{createMessage(ONBOARDING_CHECKLIST_COMPLETE_TEXT)}
      </StatusWrapper>
      <StyledList>
        <StyledListItem>
          <StyledListItemTextWrapper>
            <StyledCompleteMarker>
              <Icon
                className="flex"
                color={
                  datasources.length || actions.length
                    ? "var(--ads-v2-color-fg-success)"
                    : ""
                }
                data-testid="checklist-datasource-complete-icon"
                name="oval-check"
                size="lg"
              />
            </StyledCompleteMarker>
            <ChecklistText active={!!datasources.length || !!actions.length}>
              <span>
                {createMessage(ONBOARDING_CHECKLIST_CONNECT_DATA_SOURCE.bold)}
              </span>
              &nbsp;
              {createMessage(ONBOARDING_CHECKLIST_CONNECT_DATA_SOURCE.normal)}
            </ChecklistText>
          </StyledListItemTextWrapper>
          {!datasources.length && !actions.length && (
            <Button
              className="t--checklist-datasource-button"
              data-testid="checklist-datasource-button"
              kind={
                suggestedNextAction ===
                createMessage(
                  () => ONBOARDING_CHECKLIST_ACTIONS.CONNECT_A_DATASOURCE,
                )
                  ? "primary"
                  : "secondary"
              }
              onClick={() => {
                AnalyticsUtil.logEvent("SIGNPOSTING_CREATE_DATASOURCE_CLICK", {
                  from: "CHECKLIST",
                });
                history.push(
                  integrationEditorURL({
                    pageId,
                    selectedTab: INTEGRATION_TABS.NEW,
                  }),
                );
              }}
              size="md"
            >
              {createMessage(
                () => ONBOARDING_CHECKLIST_ACTIONS.CONNECT_A_DATASOURCE,
              )}
            </Button>
          )}
        </StyledListItem>
        <StyledListItem>
          <StyledListItemTextWrapper>
            <StyledCompleteMarker>
              <Icon
                className="flex"
                color={actions.length ? "var(--ads-v2-color-fg-success)" : ""}
                data-testid="checklist-action-complete-icon"
                name="oval-check"
                size="lg"
              />
            </StyledCompleteMarker>
            <ChecklistText active={!!actions.length}>
              <span>
                {createMessage(ONBOARDING_CHECKLIST_CREATE_A_QUERY.bold)}
              </span>
              &nbsp;{createMessage(ONBOARDING_CHECKLIST_CREATE_A_QUERY.normal)}
            </ChecklistText>
          </StyledListItemTextWrapper>
          {!actions.length && (
            <Button
              className="t--checklist-action-button"
              data-testid="checklist-action-button"
              isDisabled={!datasources.length}
              kind={
                suggestedNextAction ===
                createMessage(() => ONBOARDING_CHECKLIST_ACTIONS.CREATE_A_QUERY)
                  ? "primary"
                  : "secondary"
              }
              onClick={() => {
                AnalyticsUtil.logEvent("SIGNPOSTING_CREATE_QUERY_CLICK", {
                  from: "CHECKLIST",
                });
                history.push(
                  integrationEditorURL({
                    pageId,
                    selectedTab: INTEGRATION_TABS.ACTIVE,
                  }),
                );
              }}
              size="md"
            >
              {createMessage(() => ONBOARDING_CHECKLIST_ACTIONS.CREATE_A_QUERY)}
            </Button>
          )}
        </StyledListItem>
        <StyledListItem>
          <StyledListItemTextWrapper>
            <StyledCompleteMarker>
              <Icon
                className="flex"
                color={
                  Object.keys(widgets).length > 1
                    ? "var(--ads-v2-color-fg-success)"
                    : ""
                }
                data-testid="checklist-widget-complete-icon"
                name="oval-check"
                size="lg"
              />
            </StyledCompleteMarker>
            <ChecklistText active={Object.keys(widgets).length > 1}>
              <span>
                {createMessage(ONBOARDING_CHECKLIST_ADD_WIDGETS.bold)}
              </span>
              &nbsp;{createMessage(ONBOARDING_CHECKLIST_ADD_WIDGETS.normal)}
            </ChecklistText>
          </StyledListItemTextWrapper>
          {Object.keys(widgets).length === 1 && (
            <Button
              className="t--checklist-widget-button"
              data-testid="checklist-widget-button"
              kind={
                suggestedNextAction ===
                createMessage(() => ONBOARDING_CHECKLIST_ACTIONS.ADD_WIDGETS)
                  ? "primary"
                  : "secondary"
              }
              onClick={() => {
                AnalyticsUtil.logEvent("SIGNPOSTING_ADD_WIDGET_CLICK", {
                  from: "CHECKLIST",
                });
                dispatch(toggleInOnboardingWidgetSelection(true));
                dispatch(forceOpenWidgetPanel(true));
                history.push(builderURL({ pageId }));
              }}
              size="md"
            >
              {createMessage(() => ONBOARDING_CHECKLIST_ACTIONS.ADD_WIDGETS)}
            </Button>
          )}
        </StyledListItem>
        <StyledListItem>
          <StyledListItemTextWrapper>
            <StyledCompleteMarker>
              <Icon
                className="flex"
                color={
                  isConnectionPresent ? "var(--ads-v2-color-fg-success)" : ""
                }
                data-testid="checklist-connection-complete-icon"
                name="oval-check"
                size="lg"
              />
            </StyledCompleteMarker>
            <ChecklistText active={!!isConnectionPresent}>
              <span>
                {createMessage(
                  ONBOARDING_CHECKLIST_CONNECT_DATA_TO_WIDGET.bold,
                )}
              </span>
              &nbsp;
              {createMessage(
                ONBOARDING_CHECKLIST_CONNECT_DATA_TO_WIDGET.normal,
              )}
            </ChecklistText>
          </StyledListItemTextWrapper>
          {!isConnectionPresent && (
            <Button
              className="t--checklist-connection-button"
              data-testid="checklist-connection-button"
              isDisabled={Object.keys(widgets).length === 1 || !actions.length}
              kind={
                suggestedNextAction ===
                createMessage(
                  () => ONBOARDING_CHECKLIST_ACTIONS.CONNECT_DATA_TO_WIDGET,
                )
                  ? "primary"
                  : "secondary"
              }
              onClick={onconnectYourWidget}
              size="md"
            >
              {createMessage(
                () => ONBOARDING_CHECKLIST_ACTIONS.CONNECT_DATA_TO_WIDGET,
              )}
            </Button>
          )}
        </StyledListItem>
        <StyledListItem>
          <StyledListItemTextWrapper>
            <StyledCompleteMarker>
              <Icon
                className="flex"
                color={isDeployed ? "var(--ads-v2-color-fg-success)" : ""}
                data-testid="checklist-deploy-complete-icon"
                name="oval-check"
                size="lg"
              />
            </StyledCompleteMarker>
            <ChecklistText active={!!isDeployed}>
              <span>
                {createMessage(ONBOARDING_CHECKLIST_DEPLOY_APPLICATIONS.bold)}
              </span>
              &nbsp;
              {createMessage(ONBOARDING_CHECKLIST_DEPLOY_APPLICATIONS.normal)}
            </ChecklistText>
          </StyledListItemTextWrapper>
          {!isDeployed && (
            <Button
              className="t--checklist-deploy-button"
              data-testid="checklist-deploy-button"
              kind={
                suggestedNextAction ===
                createMessage(
                  () => ONBOARDING_CHECKLIST_ACTIONS.DEPLOY_APPLICATIONS,
                )
                  ? "primary"
                  : "secondary"
              }
              onClick={() => {
                AnalyticsUtil.logEvent("SIGNPOSTING_PUBLISH_CLICK", {
                  from: "CHECKLIST",
                });
                dispatch({
                  type: ReduxActionTypes.PUBLISH_APPLICATION_INIT,
                  payload: {
                    applicationId,
                  },
                });
              }}
              size="md"
            >
              {createMessage(
                () => ONBOARDING_CHECKLIST_ACTIONS.DEPLOY_APPLICATIONS,
              )}
            </Button>
          )}
        </StyledListItem>
      </StyledList>
      {!isAirgappedInstance && (
        <StyledFooter
          className="flex"
          onClick={() => triggerWelcomeTour(dispatch, applicationId)}
        >
          <StyledCompleteMarker>
            <Icon name="rocket" size="lg" />
          </StyledCompleteMarker>
          <Text style={{ lineHeight: "14px" }} type={TextType.P1}>
            {createMessage(ONBOARDING_CHECKLIST_FOOTER)}
          </Text>
          <Icon name="arrow-forward" size="md" />
        </StyledFooter>
      )}
    </Wrapper>
  );
}
