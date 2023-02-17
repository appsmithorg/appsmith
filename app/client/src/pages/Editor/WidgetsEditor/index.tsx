import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getCurrentPageId,
  getCurrentPageName,
  getIsFetchingPage,
  previewModeSelector,
} from "selectors/editorSelectors";
import NavigationPreview from "./NavigationPreview";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import AnalyticsUtil from "utils/AnalyticsUtil";
import CanvasContainer from "./CanvasContainer";
import { quickScrollToWidget } from "utils/helpers";
import Debugger from "components/editorComponents/Debugger";
import OnboardingTasks from "../FirstTimeUserOnboarding/Tasks";
import CrudInfoModal from "../GeneratePage/components/CrudInfoModal";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import {
  getAppSidebarPinned,
  getCurrentApplication,
  getSidebarWidth,
} from "selectors/applicationSelectors";
import { setCanvasSelectionFromEditor } from "actions/canvasSelectionActions";
import { closePropertyPane, closeTableFilterPane } from "actions/widgetActions";
import { useAllowEditorDragToSelect } from "utils/hooks/useAllowEditorDragToSelect";
import {
  getIsOnboardingTasksView,
  inGuidedTour,
} from "selectors/onboardingSelectors";
import EditorContextProvider from "components/editorComponents/EditorContextProvider";
import Guide from "../GuidedTour/Guide";
import PropertyPaneContainer from "./PropertyPaneContainer";
import CanvasTopSection from "./EmptyCanvasSection";
import { useAutoHeightUIState } from "utils/hooks/autoHeightUIHooks";
import { isMultiPaneActive } from "selectors/multiPaneSelectors";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import { PageViewContainer } from "pages/AppViewer/AppPage.styled";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { getAppSettingsPaneContext } from "selectors/appSettingsPaneSelectors";
import { AppSettingsTabs } from "../AppSettingsPane/AppSettings";

/* eslint-disable react/display-name */
function WidgetsEditor() {
  const { deselectAll, focusWidget, selectWidget } = useWidgetSelection();
  const dispatch = useDispatch();
  const currentPageId = useSelector(getCurrentPageId);
  const currentPageName = useSelector(getCurrentPageName);
  const currentApp = useSelector(getCurrentApplication);
  const isFetchingPage = useSelector(getIsFetchingPage);
  const showOnboardingTasks = useSelector(getIsOnboardingTasksView);
  const guidedTourEnabled = useSelector(inGuidedTour);
  const isMultiPane = useSelector(isMultiPaneActive);
  const canvasWidgets = useSelector(getCanvasWidgets);
  const isPreviewMode = useSelector(previewModeSelector);
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const isAppSidebarPinned = useSelector(getAppSidebarPinned);
  const sidebarWidth = useSelector(getSidebarWidth);
  const appSettingsPaneContext = useSelector(getAppSettingsPaneContext);
  const navigationPreviewRef = useRef(null);
  const [navigationHeight, setNavigationHeight] = useState(0);
  const isAppSettingsPaneWithNavigationTabOpen =
    AppSettingsTabs.Navigation === appSettingsPaneContext?.type;

  useEffect(() => {
    if (navigationPreviewRef?.current) {
      const { offsetHeight } = navigationPreviewRef.current;

      setNavigationHeight(offsetHeight);
    } else {
      setNavigationHeight(0);
    }
  }, [
    navigationPreviewRef,
    isPreviewMode,
    appSettingsPaneContext?.type,
    currentApplicationDetails?.navigationSetting,
  ]);

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
    if (
      !isFetchingPage &&
      window.location.hash.length > 0 &&
      !guidedTourEnabled
    ) {
      const widgetIdFromURLHash = window.location.hash.slice(1);
      quickScrollToWidget(widgetIdFromURLHash, canvasWidgets);
    }
  }, [isFetchingPage, selectWidget, guidedTourEnabled]);

  const allowDragToSelect = useAllowEditorDragToSelect();
  const { isAutoHeightWithLimitsChanging } = useAutoHeightUIState();

  const handleWrapperClick = useCallback(() => {
    // Making sure that we don't deselect the widget
    // after we are done dragging the limits in auto height with limits
    if (allowDragToSelect && !isAutoHeightWithLimitsChanging) {
      focusWidget && focusWidget();
      deselectAll && deselectAll();
      dispatch(closePropertyPane());
      dispatch(closeTableFilterPane());
      dispatch(setCanvasSelectionFromEditor(false));
    }
  }, [
    allowDragToSelect,
    focusWidget,
    deselectAll,
    isAutoHeightWithLimitsChanging,
  ]);

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

  const showNavigation = () => {
    if (isPreviewMode || isAppSettingsPaneWithNavigationTabOpen) {
      return (
        <NavigationPreview
          isAppSettingsPaneWithNavigationTabOpen={
            isAppSettingsPaneWithNavigationTabOpen
          }
          ref={navigationPreviewRef}
        />
      );
    }
  };

  PerformanceTracker.stopTracking();

  return (
    <EditorContextProvider renderMode="CANVAS">
      {showOnboardingTasks ? (
        <OnboardingTasks />
      ) : (
        <>
          {guidedTourEnabled && <Guide />}
          <div className="relative flex flex-row w-full overflow-hidden">
            <div className="relative flex flex-col w-full overflow-hidden">
              <CanvasTopSection />
              <div
                className="relative flex flex-row w-full overflow-hidden justify-center"
                data-testid="widgets-editor"
                draggable
                onClick={handleWrapperClick}
                onDragStart={onDragStart}
              >
                {showNavigation()}

                <PageViewContainer
                  hasPinnedSidebar={
                    isPreviewMode || isAppSettingsPaneWithNavigationTabOpen
                      ? currentApplicationDetails?.navigationSetting
                          ?.orientation ===
                          NAVIGATION_SETTINGS.ORIENTATION.SIDE &&
                        isAppSidebarPinned
                      : false
                  }
                  sidebarWidth={
                    isPreviewMode || isAppSettingsPaneWithNavigationTabOpen
                      ? sidebarWidth
                      : 0
                  }
                >
                  <CanvasContainer
                    isAppSettingsPaneWithNavigationTabOpen={
                      AppSettingsTabs.Navigation ===
                      appSettingsPaneContext?.type
                    }
                    navigationHeight={navigationHeight}
                  />
                </PageViewContainer>

                <CrudInfoModal />
                <Debugger />
              </div>
            </div>

            {!isMultiPane && <PropertyPaneContainer />}
          </div>
        </>
      )}
    </EditorContextProvider>
  );
}

export default WidgetsEditor;
