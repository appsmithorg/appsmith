import React, { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import * as log from "loglevel";

import {
  getIsFetchingPage,
  getCurrentPageId,
  getCurrentPageName,
  previewModeSelector,
  getZoomLevel,
} from "selectors/editorSelectors";
import Toolbar from "./Toolbar";
import PageTabs from "./PageTabs";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import usePanZoom from "utils/hooks/useZoom";
import AnalyticsUtil from "utils/AnalyticsUtil";
import CanvasContainer from "./CanvasContainer";
import { flashElementsById } from "utils/helpers";
import { transform } from "utils/hooks/useZoom/utils";
import Debugger from "components/editorComponents/Debugger";
import OnboardingTasks from "../FirstTimeUserOnboarding/Tasks";
import CrudInfoModal from "../GeneratePage/components/CrudInfoModal";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { updateZoomLevel } from "actions/editorActions";
import { setCanvasSelectionFromEditor } from "actions/canvasSelectionActions";
import { closePropertyPane, closeTableFilterPane } from "actions/widgetActions";
import {
  getIsOnboardingTasksView,
  getIsOnboardingWidgetSelection,
} from "selectors/entitiesSelector";
import { useAllowEditorDragToSelect } from "utils/hooks/useAllowEditorDragToSelect";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import EditorContextProvider from "components/editorComponents/EditorContextProvider";

/* eslint-disable react/display-name */
function WidgetsEditor() {
  const { deselectAll, focusWidget, selectWidget } = useWidgetSelection();
  const dispatch = useDispatch();
  const zoomLevel = useSelector(getZoomLevel);
  const currentPageId = useSelector(getCurrentPageId);
  const currentPageName = useSelector(getCurrentPageName);
  const currentApp = useSelector(getCurrentApplication);
  const isPreviewMode = useSelector(previewModeSelector);
  const isFetchingPage = useSelector(getIsFetchingPage);
  const showOnboardingTasks = useSelector(getIsOnboardingTasksView);
  const enableFirstTimeUserOnboarding = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const isOnboardingWidgetSelection = useSelector(
    getIsOnboardingWidgetSelection,
  );
  useDynamicAppLayout();
  useEffect(() => {
    PerformanceTracker.stopTracking(PerformanceTransactionName.CLOSE_SIDE_PANE);
  });

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
      flashElementsById(widgetIdFromURLHash);
      if (document.getElementById(widgetIdFromURLHash))
        selectWidget(widgetIdFromURLHash);
    }
  }, [isFetchingPage, selectWidget]);

  const handleWrapperClick = useCallback(() => {
    focusWidget && focusWidget();
    deselectAll && deselectAll();
    dispatch(closePropertyPane());
    dispatch(closeTableFilterPane());
    dispatch(setCanvasSelectionFromEditor(false));
  }, [focusWidget, deselectAll]);

  const allowDragToSelect = useAllowEditorDragToSelect();

  /**
   *  drag event handler for selection drawing
   */
  const onDragStart = useCallback(
    (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      if (allowDragToSelect) {
        const startPoints = {
          x: e.clientX,
          y: e.clientY,
        };
        dispatch(setCanvasSelectionFromEditor(true, startPoints));
      }
    },
    [allowDragToSelect],
  );

  log.debug("Canvas rendered");

  /**
   * dispatches an action that updates zoom level
   */
  const onZoom = useCallback(
    (transform: transform) => {
      dispatch(updateZoomLevel(transform.zoom));
    },
    [dispatch],
  );

  const {
    panZoomHandlers,
    setContainer,
    setZoom,
    transform,
    zoom,
  } = usePanZoom({
    onZoom,
    enablePan: false,
    enableZoom: isPreviewMode === false,
    maxZoom: 1,
  });

  /**
   * resetting panning and zoom when preview mode is on
   */
  useEffect(() => {
    if (isPreviewMode === true) {
      setZoom(1);
    }
  }, [isPreviewMode]);

  /**
   * if zoom level is changed from somewhere else and is not equal to state zoom update it
   */
  useEffect(() => {
    if (zoomLevel !== zoom) {
      setZoom(zoomLevel);
    }
  }, [zoomLevel]);

  PerformanceTracker.stopTracking();
  return (
    <EditorContextProvider>
      {enableFirstTimeUserOnboarding &&
      showOnboardingTasks &&
      !isOnboardingWidgetSelection ? (
        <OnboardingTasks />
      ) : (
        <div
          className="relative overflow-hidden"
          data-testid="widgets-editor"
          draggable
          onClick={handleWrapperClick}
          onDragStart={onDragStart}
          ref={(el) => setContainer(el)}
          {...panZoomHandlers}
        >
          <PageTabs />
          <Toolbar />
          <CanvasContainer transform={transform} zoom={zoom} />
          <CrudInfoModal />
          <Debugger />
        </div>
      )}
    </EditorContextProvider>
  );
}

export default WidgetsEditor;
