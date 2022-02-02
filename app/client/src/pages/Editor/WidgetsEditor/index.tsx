import React, { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  getIsFetchingPage,
  getCurrentPageId,
  getCurrentPageName,
} from "selectors/editorSelectors";
import PageTabs from "./PageTabs";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import AnalyticsUtil from "utils/AnalyticsUtil";
import CanvasContainer from "./CanvasContainer";
import { flashElementsById } from "utils/helpers";
import Debugger from "components/editorComponents/Debugger";
import OnboardingTasks from "../FirstTimeUserOnboarding/Tasks";
import CrudInfoModal from "../GeneratePage/components/CrudInfoModal";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { setCanvasSelectionFromEditor } from "actions/canvasSelectionActions";
import { closePropertyPane, closeTableFilterPane } from "actions/widgetActions";
import {
  getIsOnboardingTasksView,
  getIsOnboardingWidgetSelection,
} from "selectors/entitiesSelector";
import { useAllowEditorDragToSelect } from "utils/hooks/useAllowEditorDragToSelect";
import {
  getIsFirstTimeUserOnboardingEnabled,
  inGuidedTour,
} from "selectors/onboardingSelectors";
import EditorContextProvider from "components/editorComponents/EditorContextProvider";
import { PropertyPaneSidebar } from "components/editorComponents/PropertyPaneSidebar";
import { updateExplorerWidthAction } from "actions/explorerActions";
import { DEFAULT_PROPERTY_PANE_WIDTH } from "constants/AppConstants";
import Guide from "../GuidedTour/Guide";

/* eslint-disable react/display-name */
function WidgetsEditor() {
  const { deselectAll, focusWidget, selectWidget } = useWidgetSelection();
  const dispatch = useDispatch();
  const currentPageId = useSelector(getCurrentPageId);
  const currentPageName = useSelector(getCurrentPageName);
  const currentApp = useSelector(getCurrentApplication);
  const isFetchingPage = useSelector(getIsFetchingPage);
  const showOnboardingTasks = useSelector(getIsOnboardingTasksView);
  const enableFirstTimeUserOnboarding = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const isOnboardingWidgetSelection = useSelector(
    getIsOnboardingWidgetSelection,
  );
  const guidedTourEnabled = useSelector(inGuidedTour);
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

  const allowDragToSelect = useAllowEditorDragToSelect();

  const handleWrapperClick = useCallback(() => {
    if (allowDragToSelect) {
      focusWidget && focusWidget();
      deselectAll && deselectAll();
      dispatch(closePropertyPane());
      dispatch(closeTableFilterPane());
      dispatch(setCanvasSelectionFromEditor(false));
    }
  }, [allowDragToSelect, focusWidget, deselectAll]);

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

  const [propertyPaneWidth, setPropertyPaneWidth] = React.useState(
    DEFAULT_PROPERTY_PANE_WIDTH,
  );

  /**
   * on property pane sidebar drag end
   *
   * @return void
   */
  const onRightSidebarDragEnd = useCallback(() => {
    dispatch(updateExplorerWidthAction(propertyPaneWidth));
  }, [propertyPaneWidth]);

  /**
   * on property pane sidebar width change
   */
  const onRightSidebarWidthChange = useCallback((newWidth) => {
    setPropertyPaneWidth(newWidth);
  }, []);

  PerformanceTracker.stopTracking();
  return (
    <EditorContextProvider>
      {enableFirstTimeUserOnboarding &&
      showOnboardingTasks &&
      !isOnboardingWidgetSelection ? (
        <OnboardingTasks />
      ) : (
        <>
          {guidedTourEnabled && <Guide />}
          <div
            className="relative overflow-hidden flex flex-row w-full"
            data-testid="widgets-editor"
            draggable
            onClick={handleWrapperClick}
            onDragStart={onDragStart}
          >
            <PageTabs />
            <CanvasContainer />
            <CrudInfoModal />
            <Debugger />
            <PropertyPaneSidebar
              onDragEnd={onRightSidebarDragEnd}
              onWidthChange={onRightSidebarWidthChange}
              width={propertyPaneWidth}
            />
          </div>
        </>
      )}
    </EditorContextProvider>
  );
}

export default WidgetsEditor;
