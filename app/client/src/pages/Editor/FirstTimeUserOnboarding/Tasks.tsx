import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import Button from "components/ads/Button";
import {
  ONBOARDING_TASK_DATASOURCE_BODY,
  ONBOARDING_TASK_DATASOURCE_HEADER,
  ONBOARDING_TASK_DATASOURCE_BUTTON,
  ONBOARDING_TASK_DATASOURCE_FOOTER_ACTION,
  ONBOARDING_TASK_DATASOURCE_FOOTER,
  ONBOARDING_TASK_QUERY_HEADER,
  ONBOARDING_TASK_QUERY_BODY,
  ONBOARDING_TASK_QUERY_BUTTON,
  ONBOARDING_TASK_QUERY_FOOTER_ACTION,
  ONBOARDING_TASK_WIDGET_HEADER,
  ONBOARDING_TASK_WIDGET_BODY,
  ONBOARDING_TASK_WIDGET_BUTTON,
  ONBOARDING_TASK_WIDGET_FOOTER_ACTION,
  ONBOARDING_TASK_FOOTER,
  createMessage,
} from "@appsmith/constants/messages";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { INTEGRATION_EDITOR_URL, INTEGRATION_TABS } from "constants/routes";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import React from "react";
import { useDispatch } from "react-redux";

import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getCanvasWidgets,
  getDatasources,
  getPageActions,
} from "selectors/entitiesSelector";
import { getFirstTimeUserOnboardingModal } from "selectors/onboardingSelectors";
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

const getOnboardingDatasourceImg = () =>
  `${ASSETS_CDN_URL}/onboarding-datasource.svg`;
const getOnboardingQueryImg = () => `${ASSETS_CDN_URL}/onboarding-query.svg`;
const getOnboardingWidgetImg = () => `${ASSETS_CDN_URL}/onboarding-widget.svg`;

export default function OnboardingTasks() {
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  let content;
  const datasources = useSelector(getDatasources);
  const actions = useSelector(getPageActions(pageId));
  const widgets = useSelector(getCanvasWidgets);
  const dispatch = useDispatch();
  const showModal = useSelector(getFirstTimeUserOnboardingModal);
  if (!datasources.length && !actions.length) {
    content = (
      <CenteredContainer>
        <TaskImageContainer>
          <TaskImage src={getOnboardingDatasourceImg()} />
        </TaskImageContainer>
        <TaskHeader
          className="t--tasks-datasource-header"
          data-testid="onboarding-tasks-datasource-text"
        >
          {createMessage(ONBOARDING_TASK_DATASOURCE_HEADER)}
        </TaskHeader>
        <TaskSubText>
          {createMessage(ONBOARDING_TASK_DATASOURCE_BODY)}
        </TaskSubText>
        <TaskButtonWrapper>
          <StyledButton
            className="t--tasks-datasource-button"
            data-testid="onboarding-tasks-datasource-button"
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
            text={createMessage(ONBOARDING_TASK_DATASOURCE_BUTTON)}
            type="button"
          />
        </TaskButtonWrapper>
        <Taskfootnote>
          {createMessage(ONBOARDING_TASK_FOOTER)}&nbsp;
          <span
            className="t--tasks-datasource-alternate-button"
            data-testid="onboarding-tasks-datasource-alt"
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_ADD_WIDGET_CLICK", {
                from: "CANVAS",
              });
              dispatch(toggleInOnboardingWidgetSelection(true));
              dispatch(forceOpenWidgetPanel(true));
            }}
          >
            {createMessage(ONBOARDING_TASK_DATASOURCE_FOOTER_ACTION)}
          </span>
          &nbsp;{createMessage(ONBOARDING_TASK_DATASOURCE_FOOTER)}
        </Taskfootnote>
      </CenteredContainer>
    );
  } else if (!actions.length) {
    content = (
      <CenteredContainer>
        <TaskImageContainer>
          <TaskImage src={getOnboardingQueryImg()} />
        </TaskImageContainer>
        <TaskHeader
          className="t--tasks-datasource-header"
          data-testid="onboarding-tasks-action-text"
        >
          {createMessage(ONBOARDING_TASK_QUERY_HEADER)}
        </TaskHeader>
        <TaskSubText>{createMessage(ONBOARDING_TASK_QUERY_BODY)}</TaskSubText>
        <TaskButtonWrapper>
          <StyledButton
            className="t--tasks-action-button"
            data-testid="onboarding-tasks-action-button"
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
            text={createMessage(ONBOARDING_TASK_QUERY_BUTTON)}
            type="button"
          />
        </TaskButtonWrapper>
        <Taskfootnote>
          {createMessage(ONBOARDING_TASK_FOOTER)}&nbsp;
          <span
            className="t--tasks-action-alternate-button"
            data-testid="onboarding-tasks-action-alt"
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_ADD_WIDGET_CLICK", {
                from: "CANVAS",
              });
              dispatch(toggleInOnboardingWidgetSelection(true));
              dispatch(forceOpenWidgetPanel(true));
            }}
          >
            {createMessage(ONBOARDING_TASK_QUERY_FOOTER_ACTION)}
          </span>
        </Taskfootnote>
      </CenteredContainer>
    );
  } else if (Object.keys(widgets).length === 1) {
    content = (
      <CenteredContainer>
        <TaskImageContainer>
          <TaskImage src={getOnboardingWidgetImg()} />
        </TaskImageContainer>
        <TaskHeader
          className="t--tasks-datasource-header"
          data-testid="onboarding-tasks-widget-text"
        >
          {createMessage(ONBOARDING_TASK_WIDGET_HEADER)}
        </TaskHeader>
        <TaskSubText>{createMessage(ONBOARDING_TASK_WIDGET_BODY)}</TaskSubText>
        <TaskButtonWrapper>
          <StyledButton
            className="t--tasks-widget-button"
            data-testid="onboarding-tasks-widget-button"
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_ADD_WIDGET_CLICK", {
                from: "CANVAS",
              });
              dispatch(toggleInOnboardingWidgetSelection(true));
              dispatch(forceOpenWidgetPanel(true));
            }}
            tag="button"
            text={createMessage(ONBOARDING_TASK_WIDGET_BUTTON)}
            type="button"
          />
        </TaskButtonWrapper>
        <Taskfootnote>
          {createMessage(ONBOARDING_TASK_FOOTER)}&nbsp;
          <span
            className="t--tasks-widget-alternate-button"
            data-testid="onboarding-tasks-widget-alt"
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
            {createMessage(ONBOARDING_TASK_WIDGET_FOOTER_ACTION)}
          </span>
          .
        </Taskfootnote>
      </CenteredContainer>
    );
  }
  return (
    <Wrapper data-testid="onboarding-tasks-wrapper">
      {content}
      {showModal && (
        <IntroductionModal
          close={() => {
            dispatch({
              type: ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_ONBOARDING_MODAL,
              payload: false,
            });
          }}
        />
      )}
    </Wrapper>
  );
}
