import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { setCanvasSelectionFromEditor } from "actions/canvasSelectionActions";
import { closePropertyPane, closeTableFilterPane } from "actions/widgetActions";
import Debugger from "components/editorComponents/Debugger";
import EditorContextProvider from "components/editorComponents/EditorContextProvider";
import { getCurrentApplication } from "selectors/applicationSelectors";

import {
  getCurrentPageId,
  getCurrentPageName,
} from "selectors/editorSelectors";
import { isMultiPaneActive } from "selectors/multiPaneSelectors";
import {
  getIsOnboardingTasksView,
  inGuidedTour,
} from "selectors/onboardingSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useAutoHeightUIState } from "utils/hooks/autoHeightUIHooks";
import { useAllowEditorDragToSelect } from "utils/hooks/useAllowEditorDragToSelect";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import OnboardingTasks from "../FirstTimeUserOnboarding/Tasks";
import CrudInfoModal from "../GeneratePage/components/CrudInfoModal";
import Guide from "../GuidedTour/Guide";
import CanvasContainer from "./CanvasContainer";
import CanvasTopSection from "./EmptyCanvasSection";
import PageTabs from "./PageTabs";
import PropertyPaneContainer from "./PropertyPaneContainer";

function WidgetsEditor() {
  const { deselectAll, focusWidget } = useWidgetSelection();
  const dispatch = useDispatch();
  const currentPageId = useSelector(getCurrentPageId);
  const currentPageName = useSelector(getCurrentPageName);
  const currentApp = useSelector(getCurrentApplication);
  const showOnboardingTasks = useSelector(getIsOnboardingTasksView);
  const guidedTourEnabled = useSelector(inGuidedTour);
  const isMultiPane = useSelector(isMultiPaneActive);

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
                id="widgets-editor"
                onClick={handleWrapperClick}
                onDragStart={onDragStart}
              >
                <PageTabs />
                <CanvasContainer />
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
