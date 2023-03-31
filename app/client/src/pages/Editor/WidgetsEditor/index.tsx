import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Debugger from "components/editorComponents/Debugger";

import {
  getCurrentPageId,
  getCurrentPageName,
  previewModeSelector,
} from "selectors/editorSelectors";
import NavigationPreview from "./NavigationPreview";
import AnalyticsUtil from "utils/AnalyticsUtil";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import OnboardingTasks from "../FirstTimeUserOnboarding/Tasks";
import CrudInfoModal from "../GeneratePage/components/CrudInfoModal";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import {
  getAppMode,
  getAppSidebarPinned,
  getCurrentApplication,
  getSidebarWidth,
} from "@appsmith/selectors/applicationSelectors";
import { setCanvasSelectionFromEditor } from "actions/canvasSelectionActions";
import { closePropertyPane, closeTableFilterPane } from "actions/widgetActions";
import { useAllowEditorDragToSelect } from "utils/hooks/useAllowEditorDragToSelect";
import {
  getIsOnboardingTasksView,
  inGuidedTour,
} from "selectors/onboardingSelectors";
import EditorContextProvider from "components/editorComponents/EditorContextProvider";
import Guide from "../GuidedTour/Guide";
import CanvasContainer from "./CanvasContainer";
import CanvasTopSection from "./EmptyCanvasSection";
import { useAutoHeightUIState } from "utils/hooks/autoHeightUIHooks";
import { isMultiPaneActive } from "selectors/multiPaneSelectors";
import { PageViewContainer } from "pages/AppViewer/AppPage.styled";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import {
  getAppSettingsPaneContext,
  getIsAppSettingsPaneWithNavigationTabOpen,
} from "selectors/appSettingsPaneSelectors";
import { AppSettingsTabs } from "../AppSettingsPane/AppSettings";
import PropertyPaneContainer from "./PropertyPaneContainer";
import { getReadableSnapShotDetails } from "selectors/autoLayoutSelectors";
import { BannerMessage, IconSize } from "design-system-old";
import { Colors } from "constants/Colors";
import {
  createMessage,
  SNAPSHOT_BANNER_MESSAGE,
  SNAPSHOT_TIME_TILL_EXPIRATION_MESSAGE,
} from "@appsmith/constants/messages";
import SnapShotBannerCTA from "../CanvasLayoutConversion/SnapShotBannerCTA";
import classNames from "classnames";
import { APP_MODE } from "entities/App";
import useGoogleFont from "utils/hooks/useGoogleFont";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";

function WidgetsEditor() {
  const { deselectAll, focusWidget } = useWidgetSelection();
  const dispatch = useDispatch();
  const currentPageId = useSelector(getCurrentPageId);
  const currentPageName = useSelector(getCurrentPageName);
  const currentApp = useSelector(getCurrentApplication);
  const showOnboardingTasks = useSelector(getIsOnboardingTasksView);
  const guidedTourEnabled = useSelector(inGuidedTour);
  const isMultiPane = useSelector(isMultiPaneActive);
  const isPreviewMode = useSelector(previewModeSelector);
  const readableSnapShotDetails = useSelector(getReadableSnapShotDetails);

  const currentApplicationDetails = useSelector(getCurrentApplication);
  const isAppSidebarPinned = useSelector(getAppSidebarPinned);
  const sidebarWidth = useSelector(getSidebarWidth);
  const appSettingsPaneContext = useSelector(getAppSettingsPaneContext);
  const navigationPreviewRef = useRef(null);
  const [navigationHeight, setNavigationHeight] = useState(0);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const appMode = useSelector(getAppMode);
  const isPublished = appMode === APP_MODE.PUBLISHED;
  const selectedTheme = useSelector(getSelectedAppTheme);
  const fontFamily = useGoogleFont(selectedTheme.properties.fontFamily.appFont);
  const isMobile = useIsMobileDevice();
  const isPreviewingNavigation =
    isPreviewMode || isAppSettingsPaneWithNavigationTabOpen;

  const shouldShowSnapShotBanner =
    !!readableSnapShotDetails && !isPreviewingNavigation;

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
    currentApplicationDetails?.applicationDetail?.navigationSetting,
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
    if (isPreviewingNavigation) {
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
                className={classNames({
                  "relative flex flex-row w-full overflow-hidden": true,
                })}
                data-testid="widgets-editor"
                draggable
                id="widgets-editor"
                onClick={handleWrapperClick}
                onDragStart={onDragStart}
                style={{
                  fontFamily: fontFamily,
                }}
              >
                {showNavigation()}

                <PageViewContainer
                  className={classNames({
                    "relative flex flex-row w-full justify-center overflow-hidden":
                      true,
                  })}
                  hasPinnedSidebar={
                    isPreviewingNavigation && !isMobile
                      ? currentApplicationDetails?.applicationDetail
                          ?.navigationSetting?.orientation ===
                          NAVIGATION_SETTINGS.ORIENTATION.SIDE &&
                        isAppSidebarPinned
                      : false
                  }
                  isPreviewMode={isPreviewMode}
                  isPublished={isPublished}
                  sidebarWidth={isPreviewingNavigation ? sidebarWidth : 0}
                >
                  {shouldShowSnapShotBanner && (
                    <div className="absolute top-0 z-1 w-full">
                      <BannerMessage
                        backgroundColor={Colors.WARNING_ORANGE}
                        ctaChildren={<SnapShotBannerCTA />}
                        fontWeight="400"
                        icon="warning-line"
                        iconColor={Colors.WARNING_SOLID}
                        iconFlexPosition="start"
                        iconSize={IconSize.XXXXL}
                        intentLine
                        message={createMessage(SNAPSHOT_BANNER_MESSAGE)}
                        messageHeader={
                          readableSnapShotDetails
                            ? createMessage(
                                SNAPSHOT_TIME_TILL_EXPIRATION_MESSAGE,
                                readableSnapShotDetails.timeTillExpiration,
                              )
                            : ""
                        }
                        textColor={Colors.GRAY_800}
                      />
                    </div>
                  )}
                  <CanvasContainer
                    isAppSettingsPaneWithNavigationTabOpen={
                      AppSettingsTabs.Navigation ===
                      appSettingsPaneContext?.type
                    }
                    isPreviewMode={isPreviewMode}
                    navigationHeight={navigationHeight}
                    shouldShowSnapShotBanner={shouldShowSnapShotBanner}
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
