import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import Button from "components/ads/Button";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { INTEGRATION_EDITOR_URL, INTEGRATION_TABS } from "constants/routes";
import React from "react";
import { useDispatch } from "react-redux";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getActions,
  getCanvasWidgets,
  getDatasources,
} from "selectors/entitiesSelector";
import { getFirstTimeUserExperienceModal } from "selectors/onboardingSelectors";
import { useSelector } from "store";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";
import IntroductionModal from "./IntroductionModal";

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 36px);
  margin: 0 auto;
  background-color: #fff;
`;

const CenteredContainer = styled.div`
  text-align: center;
  width: 529px;
`;

const TaskImageContainer = styled.div`
  width: 220px;
  margin: 0 auto;
`;

const TaskImage = styled.img`
  width: 100%;
`;

const TaskHeader = styled.h5`
  font-size: 24px;
  margin-bottom: 16px;
`;

const TaskSubText = styled.p`
  width: 100%;
`;

const TaskButtonWrapper = styled.div`
  margin-top: 30px;
`;

const StyledButton = styled(Button)`
  width: 208px;
  margin: 0 auto;
  height: 38px;
`;

const Taskfootnote = styled.p`
  margin-top: 30px;
  & span {
    color: ${(props) => props.theme.colors.welcomeTourStickySidebarBackground};
    font-weight: 600;
    cursor: pointer;
  }
`;

export default function OnboardingTasks() {
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  let content;
  const datasources = useSelector(getDatasources);
  const actions = useSelector(getActions);
  const widgets = useSelector(getCanvasWidgets);
  const dispatch = useDispatch();
  const showModal = useSelector(getFirstTimeUserExperienceModal);
  if (!datasources.length) {
    content = (
      <CenteredContainer>
        <TaskImageContainer>
          <TaskImage src="https://assets.appsmith.com/onboarding-datasource.png" />
        </TaskImageContainer>
        <TaskHeader>Start by adding your first Data source</TaskHeader>
        <TaskSubText>
          Adding a data source makes creating applications more powerful. Don’t
          worry if you don’t have any data to hand, we have sample data you can
          use.
        </TaskSubText>
        <TaskButtonWrapper>
          <StyledButton
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_CREATE_DATASOURCE_CLICK", {
                from: "CANVAS",
              });
              history.push(
                INTEGRATION_EDITOR_URL(
                  applicationId,
                  pageId,
                  INTEGRATION_TABS.NEW,
                ),
              );
            }}
            tag="button"
            text="+ create a datasource"
            type="button"
          />
        </TaskButtonWrapper>
        <Taskfootnote>
          Alternatively you can also&nbsp;
          <span
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_ADD_WIDGET_CLICK", {
                from: "CANVAS",
              });
              dispatch(toggleInOnboardingWidgetSelection(true));
            }}
          >
            Add widgets
          </span>
          &nbsp;first.
        </Taskfootnote>
      </CenteredContainer>
    );
  } else if (!actions.length) {
    content = (
      <CenteredContainer>
        <TaskImageContainer>
          <TaskImage src="https://assets.appsmith.com/onboarding-query.png" />
        </TaskImageContainer>
        <TaskHeader>Next, create a query</TaskHeader>
        <TaskSubText>
          Great job adding a data source! The next thing you can do is create a
          query on your data.
        </TaskSubText>
        <TaskButtonWrapper>
          <StyledButton
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_CREATE_QUERY_CLICK", {
                from: "CANVAS",
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
            text="+ create a query"
            type="button"
          />
        </TaskButtonWrapper>
        <Taskfootnote>
          Alternatively you can also&nbsp;
          <span
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_ADD_WIDGET_CLICK", {
                from: "CANVAS",
              });
              dispatch(toggleInOnboardingWidgetSelection(true));
            }}
          >
            Add widgets
          </span>
        </Taskfootnote>
      </CenteredContainer>
    );
  } else if (Object.keys(widgets).length == 1) {
    content = (
      <CenteredContainer>
        <TaskImageContainer>
          <TaskImage src="https://assets.appsmith.com/onboarding-query.png" />
        </TaskImageContainer>
        <TaskHeader>Next, add a widget to start displaying data</TaskHeader>
        <TaskSubText>
          Great job adding a data source! The next thing you can do is add
          widget to start start making your data visual.
        </TaskSubText>
        <TaskButtonWrapper>
          <StyledButton
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_ADD_WIDGET_CLICK", {
                from: "CANVAS",
              });
              dispatch(toggleInOnboardingWidgetSelection(true));
            }}
            tag="button"
            text="+ Add a Widget"
            type="button"
          />
        </TaskButtonWrapper>
        <Taskfootnote>
          Alternatively you can also&nbsp;
          <span
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_PUBLISH_CLICK", {
                from: "CANVAS",
              });
              dispatch({
                type: ReduxActionTypes.PUBLISH_APPLICATION_INIT,
                payload: {
                  applicationId,
                },
              });
            }}
          >
            Deploy your applications
          </span>
          .
        </Taskfootnote>
      </CenteredContainer>
    );
  }
  return (
    <Wrapper>
      {content}
      {showModal && (
        <IntroductionModal
          close={() => {
            dispatch({
              type: ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_EXPERIENCE_MODAL,
              payload: false,
            });
          }}
        />
      )}
    </Wrapper>
  );
}
