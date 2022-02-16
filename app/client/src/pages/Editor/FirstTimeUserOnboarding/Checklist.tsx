import Button, { Category } from "components/ads/Button";
import Text, { TextType } from "components/ads/Text";
import { Icon } from "@blueprintjs/core";
import React from "react";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import { useSelector } from "store";
import {
  getCanvasWidgets,
  getDatasources,
  getPageActions,
} from "selectors/entitiesSelector";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import { useIsWidgetActionConnectionPresent } from "pages/Editor/utils";
import { getEvaluationInverseDependencyMap } from "selectors/dataTreeSelectors";
import {
  APPLICATIONS_URL,
  BUILDER_PAGE_URL,
  INTEGRATION_EDITOR_URL,
  INTEGRATION_TABS,
} from "constants/routes";
import {
  getApplicationLastDeployedAt,
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import history from "utils/history";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  getFirstTimeUserOnboardingComplete,
  getEnableFirstTimeUserOnboarding,
} from "selectors/onboardingSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Colors } from "constants/Colors";
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
import { Datasource } from "entities/Datasource";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { triggerWelcomeTour } from "./Utils";

const Wrapper = styled.div`
  padding: ${(props) => props.theme.spaces[7]}px 55px;
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

const LIST_WIDTH_OFFSET = 160;

const StyledList = styled.ul`
  margin: 0;
  padding: 0;
  list-style-type: none;
  width: calc(100% - ${LIST_WIDTH_OFFSET}px);
  overflow: auto;
`;

const StyledListItem = styled.li`
  width: 100%;
  display: flex;
  padding: ${(props) => props.theme.spaces[12]}px 0px;
  align-items: center;
  border-bottom: 1px solid ${(props) => props.theme.colors.grid};
  &:first-child {
    border-top: 1px solid ${(props) => props.theme.colors.grid};
  }
`;

const CHECKLIST_WIDTH_OFFSET = 268;

const ChecklistText = styled.div<{ active: boolean }>`
  flex-basis: calc(100% - ${CHECKLIST_WIDTH_OFFSET}px);
  color: ${(props) => (props.active ? props.theme.colors.text.normal : "")};
  & span {
    font-weight: 700;
  }
`;

const CompeleteMarkerIcon = styled.div<{ success: boolean }>`
  width: 25px;
  height: 25px;
  border-radius: 30px;
  border: 2px solid;
  border-color: ${(props) =>
    props.success ? props.theme.colors.success.main : Colors.SILVER_CHALICE};
  padding: 2px 2px;

  .bp3-icon {
    vertical-align: initial;
  }
`;

const StyledCompleteMarker = styled.div`
  flex-basis: 40px;
`;

const StyledButton = styled(Button)`
  width: 218px;
  height: 30px;
`;

const Backbutton = styled.span`
  color: ${Colors.DIESEL};
  cursor: pointer;
`;

const Banner = styled.div`
  width: calc(100% - 113px);
  border: 1px solid ${(props) => props.theme.colors.table.border};
  padding: ${(props) => props.theme.spaces[7]}px;
  margin-top: ${(props) => props.theme.spaces[7]}px;
`;

const BannerHeader = styled.h5`
  font-size: 20px;
  margin: 0;
`;

const BannerText = styled.p`
  margin: ${(props) => props.theme.spaces[3]}px 0px
    ${(props) => props.theme.spaces[7]}px;
`;

const StyledImg = styled.img`
  width: 20px;
  margin-right: 5px;
`;

const StyledFooter = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-top: ${(props) => props.theme.spaces[9]}px;
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
  const theme = useSelector(getCurrentThemeDetails);
  const applicationId = useSelector(getCurrentApplicationId);
  const isDeployed = !!useSelector(getApplicationLastDeployedAt);
  const isCompleted = useSelector(getFirstTimeUserOnboardingComplete);
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getEnableFirstTimeUserOnboarding,
  );
  if (!isFirstTimeUserOnboardingEnabled && !isCompleted) {
    return <Redirect to={BUILDER_PAGE_URL({ applicationId, pageId })} />;
  }
  const {
    completedTasks,
    suggestedNextAction,
  } = getSuggestedNextActionAndCompletedTasks(
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
      history.push(BUILDER_PAGE_URL({ applicationId, pageId }));
    }
    AnalyticsUtil.logEvent("SIGNPOSTING_CONNECT_WIDGET_CLICK");
  };
  return (
    <Wrapper data-testid="checklist-wrapper">
      <Backbutton
        className="t--checklist-back"
        onClick={() =>
          history.push(BUILDER_PAGE_URL({ applicationId, pageId }))
        }
      >
        <Icon color={Colors.DIESEL} icon="chevron-left" iconSize={16} />
        <Text style={{ lineHeight: "14px" }} type={TextType.P1}>
          Back
        </Text>
      </Backbutton>
      {isCompleted && (
        <Banner data-testid="checklist-completion-banner">
          <BannerHeader>
            {createMessage(ONBOARDING_CHECKLIST_BANNER_HEADER)}
          </BannerHeader>
          <BannerText>
            {createMessage(ONBOARDING_CHECKLIST_BANNER_BODY)}
          </BannerText>
          <StyledButton
            category={Category.primary}
            onClick={() => history.push(APPLICATIONS_URL)}
            text={createMessage(ONBOARDING_CHECKLIST_BANNER_BUTTON)}
            type="button"
          />
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
          <StyledCompleteMarker>
            <CompeleteMarkerIcon
              success={!!datasources.length || !!actions.length}
            >
              <Icon
                className="flex"
                color={
                  datasources.length || actions.length
                    ? theme.colors.success.main
                    : Colors.SILVER_CHALICE
                }
                data-testid="checklist-datasource-complete-icon"
                icon={
                  datasources.length || actions.length
                    ? "tick-circle"
                    : "small-tick"
                }
                iconSize={17}
              />
            </CompeleteMarkerIcon>
          </StyledCompleteMarker>
          <ChecklistText active={!!datasources.length || !!actions.length}>
            <span>
              {createMessage(ONBOARDING_CHECKLIST_CONNECT_DATA_SOURCE.bold)}
            </span>
            &nbsp;
            {createMessage(ONBOARDING_CHECKLIST_CONNECT_DATA_SOURCE.normal)}
          </ChecklistText>
          {!datasources.length && !actions.length && (
            <StyledButton
              category={
                suggestedNextAction ===
                createMessage(
                  () => ONBOARDING_CHECKLIST_ACTIONS.CONNECT_A_DATASOURCE,
                )
                  ? Category.primary
                  : Category.tertiary
              }
              className="t--checklist-datasource-button"
              data-testid="checklist-datasource-button"
              onClick={() => {
                AnalyticsUtil.logEvent("SIGNPOSTING_CREATE_DATASOURCE_CLICK", {
                  from: "CHECKLIST",
                });
                history.push(
                  INTEGRATION_EDITOR_URL(
                    applicationId,
                    pageId,
                    INTEGRATION_TABS.NEW,
                  ),
                );
              }}
              text={createMessage(
                () => ONBOARDING_CHECKLIST_ACTIONS.CONNECT_A_DATASOURCE,
              )}
              type="button"
            />
          )}
        </StyledListItem>
        <StyledListItem>
          <StyledCompleteMarker>
            <CompeleteMarkerIcon success={!!actions.length}>
              <Icon
                className="flex"
                color={
                  actions.length
                    ? theme.colors.success.main
                    : Colors.SILVER_CHALICE
                }
                data-testid="checklist-action-complete-icon"
                icon={actions.length ? "tick-circle" : "small-tick"}
                iconSize={17}
              />
            </CompeleteMarkerIcon>
          </StyledCompleteMarker>
          <ChecklistText active={!!actions.length}>
            <span>
              {createMessage(ONBOARDING_CHECKLIST_CREATE_A_QUERY.bold)}
            </span>
            &nbsp;{createMessage(ONBOARDING_CHECKLIST_CREATE_A_QUERY.normal)}
          </ChecklistText>
          {!actions.length && (
            <StyledButton
              category={
                suggestedNextAction ===
                createMessage(() => ONBOARDING_CHECKLIST_ACTIONS.CREATE_A_QUERY)
                  ? Category.primary
                  : Category.tertiary
              }
              className="t--checklist-action-button"
              data-testid="checklist-action-button"
              disabled={!datasources.length}
              onClick={() => {
                AnalyticsUtil.logEvent("SIGNPOSTING_CREATE_QUERY_CLICK", {
                  from: "CHECKLIST",
                });
                history.push(
                  INTEGRATION_EDITOR_URL(
                    applicationId,
                    pageId,
                    INTEGRATION_TABS.ACTIVE,
                  ),
                );
              }}
              tag="button"
              text={createMessage(
                () => ONBOARDING_CHECKLIST_ACTIONS.CREATE_A_QUERY,
              )}
              type="button"
            />
          )}
        </StyledListItem>
        <StyledListItem>
          <StyledCompleteMarker>
            <CompeleteMarkerIcon success={Object.keys(widgets).length > 1}>
              <Icon
                className="flex"
                color={
                  Object.keys(widgets).length > 1
                    ? theme.colors.success.main
                    : Colors.SILVER_CHALICE
                }
                data-testid="checklist-widget-complete-icon"
                icon={
                  Object.keys(widgets).length > 1 ? "tick-circle" : "small-tick"
                }
                iconSize={17}
              />
            </CompeleteMarkerIcon>
          </StyledCompleteMarker>
          <ChecklistText active={Object.keys(widgets).length > 1}>
            <span>{createMessage(ONBOARDING_CHECKLIST_ADD_WIDGETS.bold)}</span>
            &nbsp;{createMessage(ONBOARDING_CHECKLIST_ADD_WIDGETS.normal)}
          </ChecklistText>
          {Object.keys(widgets).length === 1 && (
            <StyledButton
              category={
                suggestedNextAction ===
                createMessage(() => ONBOARDING_CHECKLIST_ACTIONS.ADD_WIDGETS)
                  ? Category.primary
                  : Category.tertiary
              }
              className="t--checklist-widget-button"
              data-testid="checklist-widget-button"
              onClick={() => {
                AnalyticsUtil.logEvent("SIGNPOSTING_ADD_WIDGET_CLICK", {
                  from: "CHECKLIST",
                });
                dispatch(toggleInOnboardingWidgetSelection(true));
                dispatch(forceOpenWidgetPanel(true));
                history.push(BUILDER_PAGE_URL({ applicationId, pageId }));
              }}
              text={createMessage(
                () => ONBOARDING_CHECKLIST_ACTIONS.ADD_WIDGETS,
              )}
              type="button"
            />
          )}
        </StyledListItem>
        <StyledListItem>
          <StyledCompleteMarker>
            <CompeleteMarkerIcon success={!!isConnectionPresent}>
              <Icon
                className="flex"
                color={
                  isConnectionPresent
                    ? theme.colors.success.main
                    : Colors.SILVER_CHALICE
                }
                data-testid="checklist-connection-complete-icon"
                icon={isConnectionPresent ? "tick-circle" : "small-tick"}
                iconSize={17}
              />
            </CompeleteMarkerIcon>
          </StyledCompleteMarker>
          <ChecklistText active={!!isConnectionPresent}>
            <span>
              {createMessage(ONBOARDING_CHECKLIST_CONNECT_DATA_TO_WIDGET.bold)}
            </span>
            &nbsp;
            {createMessage(ONBOARDING_CHECKLIST_CONNECT_DATA_TO_WIDGET.normal)}
          </ChecklistText>
          {!isConnectionPresent && (
            <StyledButton
              category={
                suggestedNextAction ===
                createMessage(
                  () => ONBOARDING_CHECKLIST_ACTIONS.CONNECT_DATA_TO_WIDGET,
                )
                  ? Category.primary
                  : Category.tertiary
              }
              className="t--checklist-connection-button"
              data-testid="checklist-connection-button"
              disabled={Object.keys(widgets).length === 1 || !actions.length}
              onClick={onconnectYourWidget}
              tag="button"
              text={createMessage(
                () => ONBOARDING_CHECKLIST_ACTIONS.CONNECT_DATA_TO_WIDGET,
              )}
              type="button"
            />
          )}
        </StyledListItem>
        <StyledListItem>
          <StyledCompleteMarker>
            <CompeleteMarkerIcon success={!!isDeployed}>
              <Icon
                className="flex"
                color={
                  isDeployed ? theme.colors.success.main : Colors.SILVER_CHALICE
                }
                data-testid="checklist-deploy-complete-icon"
                icon={isDeployed ? "tick-circle" : "small-tick"}
                iconSize={17}
              />
            </CompeleteMarkerIcon>
          </StyledCompleteMarker>
          <ChecklistText active={!!isDeployed}>
            <span>
              {createMessage(ONBOARDING_CHECKLIST_DEPLOY_APPLICATIONS.bold)}
            </span>
            &nbsp;
            {createMessage(ONBOARDING_CHECKLIST_DEPLOY_APPLICATIONS.normal)}
          </ChecklistText>
          {!isDeployed && (
            <StyledButton
              category={
                suggestedNextAction ===
                createMessage(
                  () => ONBOARDING_CHECKLIST_ACTIONS.DEPLOY_APPLICATIONS,
                )
                  ? Category.primary
                  : Category.tertiary
              }
              className="t--checklist-deploy-button"
              data-testid="checklist-deploy-button"
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
              text={createMessage(
                () => ONBOARDING_CHECKLIST_ACTIONS.DEPLOY_APPLICATIONS,
              )}
              type="button"
            />
          )}
        </StyledListItem>
      </StyledList>
      <StyledFooter
        className="flex"
        onClick={() => triggerWelcomeTour(dispatch)}
      >
        <StyledImg src="https://assets.appsmith.com/Rocket.png" />
        <Text style={{ lineHeight: "14px" }} type={TextType.P1}>
          {createMessage(ONBOARDING_CHECKLIST_FOOTER)}
        </Text>
        <Icon
          color={theme.colors.applications.iconColor}
          icon="chevron-right"
          iconSize={16}
        />
      </StyledFooter>
    </Wrapper>
  );
}
