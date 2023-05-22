import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { Button, Link } from "design-system";
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
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { INTEGRATION_TABS } from "constants/routes";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getCanvasWidgets,
  getDatasources,
  getPageActions,
} from "selectors/entitiesSelector";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";
import { integrationEditorURL } from "RouteBuilder";
import { getAssetUrl, isAirgapped } from "@appsmith/utils/airgapHelpers";
import AnonymousDataPopup from "./AnonymousDataPopup";
import {
  getFirstTimeUserOnboardingComplete,
  getIsFirstTimeUserOnboardingEnabled,
} from "selectors/onboardingSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  getFirstTimeUserOnboardingTelemetryCalloutIsAlreadyShown,
  setFirstTimeUserOnboardingTelemetryCalloutVisibility,
} from "utils/storage";
import { ANONYMOUS_DATA_POPOP_TIMEOUT } from "./constants";
import { DatasourceCreateEntryPoints } from "constants/Datasource";

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
  width: 180px;
  margin: 0 auto;
`;

const TaskImage = styled.img`
  width: 100%;
`;

const TaskHeader = styled.h5`
  font-size: 20px;
  margin-top: 16px;
  margin-bottom: 16px;
`;

const TaskSubText = styled.p`
  width: 100%;
`;

const TaskButtonWrapper = styled.div`
  margin-top: 30px;
`;

const Taskfootnote = styled.p`
  margin-top: 30px;
  display: flex;
  justify-content: center;
`;

const getOnboardingDatasourceImg = () =>
  `${ASSETS_CDN_URL}/onboarding-datasource.svg`;
const getOnboardingQueryImg = () => `${ASSETS_CDN_URL}/onboarding-query.svg`;
const getOnboardingWidgetImg = () => `${ASSETS_CDN_URL}/onboarding-widget.svg`;

export default function OnboardingTasks() {
  const [isAnonymousDataPopupOpen, setisAnonymousDataPopupOpen] =
    useState(false);

  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  let content;
  const datasources = useSelector(getDatasources);
  const actions = useSelector(getPageActions(pageId));
  const widgets = useSelector(getCanvasWidgets);
  const dispatch = useDispatch();
  const user = useSelector(getCurrentUser);
  const isAdmin = user?.isSuperUser || false;
  const isOnboardingCompleted = useSelector(getFirstTimeUserOnboardingComplete);

  const hideAnonymousDataPopup = () => {
    setisAnonymousDataPopupOpen(false);
    setFirstTimeUserOnboardingTelemetryCalloutVisibility(true);
  };

  const showShowAnonymousDataPopup = async () => {
    const shouldPopupShow =
      !isAirgapped() &&
      isFirstTimeUserOnboardingEnabled &&
      isAdmin &&
      !isOnboardingCompleted;
    if (shouldPopupShow) {
      const isAnonymousDataPopupAlreadyOpen =
        await getFirstTimeUserOnboardingTelemetryCalloutIsAlreadyShown();
      //true if the modal was already shown else show the modal and set to already shown, also hide the modal after 10 secs
      if (isAnonymousDataPopupAlreadyOpen) {
        setisAnonymousDataPopupOpen(false);
      } else {
        setisAnonymousDataPopupOpen(true);
        setTimeout(() => {
          hideAnonymousDataPopup();
        }, ANONYMOUS_DATA_POPOP_TIMEOUT);
        await setFirstTimeUserOnboardingTelemetryCalloutVisibility(true);
      }
    } else {
      setisAnonymousDataPopupOpen(shouldPopupShow);
    }
  };

  useEffect(() => {
    showShowAnonymousDataPopup();
  }, []);

  if (!datasources.length && !actions.length) {
    content = (
      <CenteredContainer>
        <TaskImageContainer>
          <TaskImage src={getAssetUrl(getOnboardingDatasourceImg())} />
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
          <Button
            className="t--tasks-datasource-button"
            data-testid="onboarding-tasks-datasource-button"
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_CREATE_DATASOURCE_CLICK", {
                from: "CANVAS",
              });
              history.push(
                integrationEditorURL({
                  pageId,
                  selectedTab: INTEGRATION_TABS.NEW,
                }),
              );
              // Event for datasource creation click
              const entryPoint = DatasourceCreateEntryPoints.ONBOARDING;
              AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
                entryPoint,
              });
            }}
            size="md"
            startIcon="plus"
          >
            {createMessage(ONBOARDING_TASK_DATASOURCE_BUTTON)}
          </Button>
        </TaskButtonWrapper>
        <Taskfootnote>
          {createMessage(ONBOARDING_TASK_FOOTER)}&nbsp;
          <Link
            className="t--tasks-datasource-alternate-button"
            data-testid="onboarding-tasks-datasource-alt"
            kind="primary"
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_ADD_WIDGET_CLICK", {
                from: "CANVAS",
              });
              dispatch(toggleInOnboardingWidgetSelection(true));
              dispatch(forceOpenWidgetPanel(true));
            }}
          >
            {createMessage(ONBOARDING_TASK_DATASOURCE_FOOTER_ACTION)}
          </Link>
          &nbsp;{createMessage(ONBOARDING_TASK_DATASOURCE_FOOTER)}
        </Taskfootnote>
      </CenteredContainer>
    );
  } else if (!actions.length) {
    content = (
      <CenteredContainer>
        <TaskImageContainer>
          <TaskImage src={getAssetUrl(getOnboardingQueryImg())} />
        </TaskImageContainer>
        <TaskHeader
          className="t--tasks-datasource-header"
          data-testid="onboarding-tasks-action-text"
        >
          {createMessage(ONBOARDING_TASK_QUERY_HEADER)}
        </TaskHeader>
        <TaskSubText>{createMessage(ONBOARDING_TASK_QUERY_BODY)}</TaskSubText>
        <TaskButtonWrapper>
          <Button
            className="t--tasks-action-button"
            data-testid="onboarding-tasks-action-button"
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_CREATE_QUERY_CLICK", {
                from: "CANVAS",
              });
              history.push(
                integrationEditorURL({
                  pageId,
                  selectedTab: INTEGRATION_TABS.ACTIVE,
                }),
              );
            }}
            size="md"
            startIcon="plus"
          >
            {createMessage(ONBOARDING_TASK_QUERY_BUTTON)}
          </Button>
        </TaskButtonWrapper>
        <Taskfootnote>
          {createMessage(ONBOARDING_TASK_FOOTER)}&nbsp;
          <Link
            className="t--tasks-action-alternate-button"
            data-testid="onboarding-tasks-action-alt"
            kind="primary"
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_ADD_WIDGET_CLICK", {
                from: "CANVAS",
              });
              dispatch(toggleInOnboardingWidgetSelection(true));
              dispatch(forceOpenWidgetPanel(true));
            }}
          >
            {createMessage(ONBOARDING_TASK_QUERY_FOOTER_ACTION)}
          </Link>
        </Taskfootnote>
      </CenteredContainer>
    );
  } else if (Object.keys(widgets).length === 1) {
    content = (
      <CenteredContainer>
        <TaskImageContainer>
          <TaskImage src={getAssetUrl(getOnboardingWidgetImg())} />
        </TaskImageContainer>
        <TaskHeader
          className="t--tasks-datasource-header"
          data-testid="onboarding-tasks-widget-text"
        >
          {createMessage(ONBOARDING_TASK_WIDGET_HEADER)}
        </TaskHeader>
        <TaskSubText>{createMessage(ONBOARDING_TASK_WIDGET_BODY)}</TaskSubText>
        <TaskButtonWrapper>
          <Button
            className="t--tasks-widget-button"
            data-testid="onboarding-tasks-widget-button"
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_ADD_WIDGET_CLICK", {
                from: "CANVAS",
              });
              dispatch(toggleInOnboardingWidgetSelection(true));
              dispatch(forceOpenWidgetPanel(true));
            }}
            size="md"
            startIcon="plus"
          >
            {createMessage(ONBOARDING_TASK_WIDGET_BUTTON)}
          </Button>
        </TaskButtonWrapper>
        <Taskfootnote>
          {createMessage(ONBOARDING_TASK_FOOTER)}&nbsp;
          <Link
            className="t--tasks-widget-alternate-button"
            data-testid="onboarding-tasks-widget-alt"
            kind="primary"
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
          </Link>
          .
        </Taskfootnote>
      </CenteredContainer>
    );
  }
  return (
    <Wrapper data-testid="onboarding-tasks-wrapper">
      {content}
      {isAnonymousDataPopupOpen && (
        <AnonymousDataPopup onCloseCallout={hideAnonymousDataPopup} />
      )}
    </Wrapper>
  );
}
