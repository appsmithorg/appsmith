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
import { useWidgetSelection } from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import * as log from "loglevel";
import { getCanvasClassName } from "utils/generators";
import { flashElementById } from "utils/helpers";
import { useParams } from "react-router";
import { fetchPage } from "actions/pageActions";

const EditorWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  overflow: hidden;
  height: calc(100vh - ${props => props.theme.headerHeight});
`;

const CanvasContainer = styled.section`
  height: 100%;
  width: 100%;
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
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
const WidgetsEditor = () => {
  const { focusWidget, selectWidget } = useWidgetSelection();
  const params = useParams<{ applicationId: string; pageId: string }>();
  const dispatch = useDispatch();

  const widgets = useSelector(getCanvasWidgetDsl);
  const isFetchingPage = useSelector(getIsFetchingPage);
  const currentPageId = useSelector(getCurrentPageId);
  const currentPageName = useSelector(getCurrentPageName);

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
        mode: "EDIT",
      });
    }
  }, [currentPageName, currentPageId]);

  // navigate to widget
  useEffect(() => {
    if (!isFetchingPage && window.location.hash.length > 0) {
      const widgetIdFromURLHash = window.location.hash.substr(1);
      flashElementById(widgetIdFromURLHash);
      selectWidget(widgetIdFromURLHash);
    }
  }, [isFetchingPage, selectWidget]);

  const handleWrapperClick = useCallback(() => {
    focusWidget && focusWidget();
    selectWidget && selectWidget();
  }, [focusWidget, selectWidget]);

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
  return (
    <EditorContextProvider>
      <EditorWrapper onClick={handleWrapperClick}>
        <CanvasContainer key={currentPageId} className={getCanvasClassName()}>
          {node}
        </CanvasContainer>
      </EditorWrapper>
    </EditorContextProvider>
  );
};

export default WidgetsEditor;
