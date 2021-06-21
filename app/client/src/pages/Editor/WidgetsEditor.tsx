import React, { useEffect, ReactNode, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import Canvas from "./Canvas";
import {
  getIsFetchingPage,
  getCurrentPageId,
  getCanvasWidgetDsl,
  getCurrentPageName,
} from "selectors/editorSelectors";
import Centered from "components/designSystems/appsmith/CenteredWrapper";
import EditorContextProvider from "components/editorComponents/EditorContextProvider";
import { Spinner } from "@blueprintjs/core";
import AnalyticsUtil from "utils/AnalyticsUtil";
import * as log from "loglevel";
import { getCanvasClassName } from "utils/generators";
import { flashElementById } from "utils/helpers";
import { useParams } from "react-router";
import { fetchPage } from "actions/pageActions";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { MainContainerLayoutControl } from "./MainContainerLayoutControl";
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";
import Debugger from "components/editorComponents/Debugger";
import { closePropertyPane } from "actions/widgetActions";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";

const EditorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  overflow: hidden;
  height: calc(100vh - ${(props) => props.theme.smallHeaderHeight});
`;

const CanvasContainer = styled.section`
  height: 100%;
  width: 100%;
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
  padding-top: 1px;
  &:before {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }
`;

/* eslint-disable react/display-name */
function WidgetsEditor() {
  const { deselectAll, focusWidget, selectWidget } = useWidgetSelection();
  const params = useParams<{ applicationId: string; pageId: string }>();
  const dispatch = useDispatch();

  const widgets = useSelector(getCanvasWidgetDsl);
  const isFetchingPage = useSelector(getIsFetchingPage);
  const currentPageId = useSelector(getCurrentPageId);
  const currentPageName = useSelector(getCurrentPageName);
  const currentApp = useSelector(getCurrentApplication);
  useDynamicAppLayout();
  useEffect(() => {
    PerformanceTracker.stopTracking(PerformanceTransactionName.CLOSE_SIDE_PANE);
  });

  // Switch page
  useEffect(() => {
    if (currentPageId !== params.pageId && !!params.pageId) {
      dispatch(fetchPage(params.pageId));
    }
  }, [currentPageId, params.pageId, dispatch]);

  // log page load
  useEffect(() => {
    if (currentPageName !== undefined && currentPageId !== undefined) {
      AnalyticsUtil.logEvent("PAGE_LOAD", {
        pageName: currentPageName,
        pageId: currentPageId,
        appName: currentApp?.name,
        mode: "EDIT",
      });
    }
  }, [currentPageName, currentPageId]);

  // navigate to widget
  useEffect(() => {
    if (!isFetchingPage && window.location.hash.length > 0) {
      const widgetIdFromURLHash = window.location.hash.substr(1);
      flashElementById(widgetIdFromURLHash);
      if (document.getElementById(widgetIdFromURLHash))
        selectWidget(widgetIdFromURLHash);
    }
  }, [isFetchingPage, selectWidget]);

  const handleWrapperClick = useCallback(() => {
    focusWidget && focusWidget();
    deselectAll && deselectAll();
    dispatch(closePropertyPane());
  }, [focusWidget, deselectAll]);

  const pageLoading = (
    <Centered>
      <Spinner />
    </Centered>
  );
  let node: ReactNode;
  if (isFetchingPage) {
    node = pageLoading;
  }

  if (!isFetchingPage && widgets) {
    node = <Canvas dsl={widgets} />;
  }

  log.debug("Canvas rendered");
  PerformanceTracker.stopTracking();
  return (
    <EditorContextProvider>
      <EditorWrapper onClick={handleWrapperClick}>
        <MainContainerLayoutControl />
        <CanvasContainer className={getCanvasClassName()} key={currentPageId}>
          {node}
        </CanvasContainer>
        <Debugger />
      </EditorWrapper>
    </EditorContextProvider>
  );
}

export default WidgetsEditor;
