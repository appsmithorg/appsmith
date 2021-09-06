import Button, { Category } from "components/ads/Button";
import Text, { TextType } from "components/ads/Text";
import { Icon } from "@blueprintjs/core";
import React from "react";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import { useSelector } from "store";
import {
  getActions,
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
  getFirstTimeUserExperienceComplete,
  getEnableFirstTimeUserExperience,
} from "selectors/onboardingSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Colors } from "constants/Colors";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { bindDataOnCanvas } from "actions/pluginActionActions";

const Wrapper = styled.div`
  padding: 15px 55px;
  background: #fff;
  height: calc(100vh - 35px);
`;

const Pageheader = styled.h4`
  font-size: ${(props) => props.theme.fontSizes[6]}px;
`;

const PageSubHeader = styled.p`
  width: 100%;
  margin-bottom: 30px;
`;

const StatusWrapper = styled.p`
  width: 100%;
  margin-bottom: 30px;
  & span {
    font-weight: 700;
  }
`;

const StyledList = styled.ul`
  margin: 0;
  padding: 0;
  list-style-type: none;
  width: calc(100% - 160px);
  overflow: auto;
`;

const StyledListItem = styled.li`
  width: 100%;
  display: flex;
  padding: 30px 0px;
  align-items: center;
  border-bottom: 1px solid ${(props) => props.theme.colors.grid};
  &:first-child {
    border-top: 1px solid ${(props) => props.theme.colors.grid};
  }
`;

const ChecklistText = styled.div`
  flex-basis: calc(100% - 268px);
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
    props.success ? props.theme.colors.success.main : "#A9A7A7"};
  padding: 2px 2px;
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
  padding: 16px;
  margin-top: 16px;
`;

const BannerHeader = styled.h5`
  font-size: 20px;
  margin: 0;
`;

const BannerText = styled.p`
  margin: 8px 0px 16px;
`;

const StyledImg = styled.img`
  width: 20px;
  transform: translate(0px, 5px);
  margin-right: 5px;
`;

const StyledFooter = styled.div`
  position: absolute;
  bottom: 10px;
  cursor: pointer;
`;

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
  const isCompleted = useSelector(getFirstTimeUserExperienceComplete);
  const isFirstTimeUserExperienceEnabled = useSelector(
    getEnableFirstTimeUserExperience,
  );
  let suggestedNextAction;
  if (!isFirstTimeUserExperienceEnabled && !isCompleted) {
    history.push(BUILDER_PAGE_URL(applicationId, pageId));
  }
  if (!datasources.length) {
    suggestedNextAction = "CREATE A DATASOURCE";
  } else if (!actions.length) {
    suggestedNextAction = "CREATE A QUERY";
  } else if (Object.keys(widgets).length == 1) {
    suggestedNextAction = "ADD WIDGETS";
  } else if (!isConnectionPresent) {
    suggestedNextAction = "CONNECT DATA TO WIDGET";
  } else if (!isDeployed) {
    suggestedNextAction = "DEPLOY APPLICATIONS";
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
      history.push(BUILDER_PAGE_URL(applicationId, pageId));
    }
    AnalyticsUtil.logEvent("SIGNPOSTING_CONNECT_WIDGET_CLICK");
  };
  return (
    <Wrapper data-testid="checklist-wrapper">
      <Backbutton
        onClick={() => history.push(BUILDER_PAGE_URL(applicationId, pageId))}
      >
        <Icon color={Colors.DIESEL} icon="chevron-left" iconSize={16} />
        <Text style={{ lineHeight: "14px" }} type={TextType.P1}>
          Back
        </Text>
      </Backbutton>
      {isCompleted && (
        <Banner data-testid="checklist-completion-banner">
          <BannerHeader>
            Amazing work! You’ve explored the basics of Appsmith
          </BannerHeader>
          <BannerText>
            You can carry on here, or explore the homepage to see how your
            projects are stored.
          </BannerText>
          <StyledButton
            category={Category.primary}
            onClick={() => history.push(APPLICATIONS_URL)}
            text="Explore homepage"
            type="button"
          />
        </Banner>
      )}
      <Pageheader>👋 Welcome to Appsmith!</Pageheader>
      <PageSubHeader>
        Let’s get you started on your first application, explore Appsmith
        yourself or follow our guide below to discover what Appsmith can do.
      </PageSubHeader>
      <StatusWrapper>
        <span data-testid="checklist-completion-info">
          {completedTasks} of 5
        </span>
        &nbsp;complete
      </StatusWrapper>
      <StyledList>
        <StyledListItem>
          <StyledCompleteMarker>
            <CompeleteMarkerIcon
              success={!!datasources.length || !!actions.length}
            >
              <Icon
                color={
                  datasources.length || actions.length
                    ? theme.colors.success.main
                    : "#A9A7A7"
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
          <ChecklistText>
            <span>Connect your data source</span> to start building an
            application.
          </ChecklistText>
          {!datasources.length && !actions.length && (
            <StyledButton
              category={
                suggestedNextAction == "CREATE A DATASOURCE"
                  ? Category.primary
                  : Category.tertiary
              }
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
              text="CONNECT DATA SOURCE"
              type="button"
            />
          )}
        </StyledListItem>
        <StyledListItem>
          <StyledCompleteMarker>
            <CompeleteMarkerIcon success={!!actions.length}>
              <Icon
                color={actions.length ? theme.colors.success.main : "#A9A7A7"}
                data-testid="checklist-action-complete-icon"
                icon={actions.length ? "tick-circle" : "small-tick"}
                iconSize={17}
              />
            </CompeleteMarkerIcon>
          </StyledCompleteMarker>
          <ChecklistText>
            <span>Create a query</span> of your data source.
          </ChecklistText>
          {!actions.length && (
            <StyledButton
              category={
                suggestedNextAction == "CREATE A QUERY"
                  ? Category.primary
                  : Category.tertiary
              }
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
              text="CREATE A QUERY"
              type="button"
            />
          )}
        </StyledListItem>
        <StyledListItem>
          <StyledCompleteMarker>
            <CompeleteMarkerIcon success={Object.keys(widgets).length > 1}>
              <Icon
                color={
                  Object.keys(widgets).length > 1
                    ? theme.colors.success.main
                    : "#A9A7A7"
                }
                data-testid="checklist-widget-complete-icon"
                icon={
                  Object.keys(widgets).length > 1 ? "tick-circle" : "small-tick"
                }
                iconSize={17}
              />
            </CompeleteMarkerIcon>
          </StyledCompleteMarker>
          <ChecklistText>
            <span>Start visualising your application</span> using widgets.
          </ChecklistText>
          {Object.keys(widgets).length == 1 && (
            <StyledButton
              category={
                suggestedNextAction == "ADD WIDGETS"
                  ? Category.primary
                  : Category.tertiary
              }
              data-testid="checklist-widget-button"
              onClick={() => {
                AnalyticsUtil.logEvent("SIGNPOSTING_ADD_WIDGET_CLICK", {
                  from: "CHECKLIST",
                });
                dispatch(toggleInOnboardingWidgetSelection(true));
                dispatch(forceOpenWidgetPanel(true));
                history.push(BUILDER_PAGE_URL(applicationId, pageId));
              }}
              text="ADD WIDGETS"
              type="button"
            />
          )}
        </StyledListItem>
        <StyledListItem>
          <StyledCompleteMarker>
            <CompeleteMarkerIcon success={!!isConnectionPresent}>
              <Icon
                color={
                  isConnectionPresent ? theme.colors.success.main : "#A9A7A7"
                }
                data-testid="checklist-connection-complete-icon"
                icon={isConnectionPresent ? "tick-circle" : "small-tick"}
                iconSize={17}
              />
            </CompeleteMarkerIcon>
          </StyledCompleteMarker>
          <ChecklistText>
            <span>Connect your data to the widgets</span> using JavaScript.
          </ChecklistText>
          {!isConnectionPresent && (
            <StyledButton
              category={
                suggestedNextAction == "CONNECT DATA TO WIDGET"
                  ? Category.primary
                  : Category.tertiary
              }
              data-testid="checklist-connection-button"
              disabled={Object.keys(widgets).length == 1}
              onClick={onconnectYourWidget}
              text="CONNECT DATA TO WIDGETS"
              type="button"
            />
          )}
        </StyledListItem>
        <StyledListItem>
          <StyledCompleteMarker>
            <CompeleteMarkerIcon success={!!isDeployed}>
              <Icon
                color={isDeployed ? theme.colors.success.main : "#A9A7A7"}
                data-testid="checklist-deploy-complete-icon"
                icon={isDeployed ? "tick-circle" : "small-tick"}
                iconSize={17}
              />
            </CompeleteMarkerIcon>
          </StyledCompleteMarker>
          <ChecklistText>
            <span>Deploy your application</span>, and see your creation live.
          </ChecklistText>
          {!isDeployed && (
            <StyledButton
              category={
                suggestedNextAction == "DEPLOY APPLICATIONS"
                  ? Category.primary
                  : Category.tertiary
              }
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
              text="DEPLOY APPLICATION"
              type="button"
            />
          )}
        </StyledListItem>
      </StyledList>
      <StyledFooter
        onClick={() => {
          AnalyticsUtil.logEvent("SIGNPOSTING_WELCOME_TOUR_CLICK");
          history.push(APPLICATIONS_URL);
          dispatch({
            type: ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_EXPERIENCE,
            payload: false,
          });
          dispatch({
            type:
              ReduxActionTypes.SET_FIRST_TIME_USER_EXPERIENCE_APPLICATION_ID,
            payload: "",
          });
          dispatch({
            type: ReduxActionTypes.ONBOARDING_CREATE_APPLICATION,
          });
        }}
      >
        <StyledImg src="https://assets.appsmith.com/Rocket.png" />
        <Text style={{ lineHeight: "14px" }} type={TextType.P1}>
          Not sure where to start? Take the welcome tour
        </Text>
        <Icon color={Colors.DIESEL} icon="chevron-right" iconSize={16} />
      </StyledFooter>
    </Wrapper>
  );
}
