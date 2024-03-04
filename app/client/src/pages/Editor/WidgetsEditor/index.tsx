import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Debugger from "components/editorComponents/Debugger";

import {
  getCanvasWidth,
  getCurrentPageId,
  getCurrentPageName,
  getIsAutoLayout,
  previewModeSelector,
} from "selectors/editorSelectors";
import styled from "styled-components";
import { CANVAS_VIEWPORT } from "../../../constants/componentClassNameConstants";
import { LayoutSystemTypes } from "../../../layoutSystems/types";
import { getLayoutSystemType } from "../../../selectors/layoutSystemSelectors";
import NavigationPreview from "./NavigationPreview";
import AnalyticsUtil from "utils/AnalyticsUtil";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import CrudInfoModal from "../GeneratePage/components/CrudInfoModal";
import {
  getAppMode,
  getAppSidebarPinned,
  getCurrentApplication,
  getSidebarWidth,
} from "@appsmith/selectors/applicationSelectors";
import { setCanvasSelectionFromEditor } from "actions/canvasSelectionActions";
import { useAllowEditorDragToSelect } from "utils/hooks/useAllowEditorDragToSelect";
import EditorContextProvider from "components/editorComponents/EditorContextProvider";
import MainContainerWrapper from "./MainContainerWrapper";
import EmptyCanvasPrompts from "./EmptyCanvasPrompts";
import { useAutoHeightUIState } from "utils/hooks/autoHeightUIHooks";
import { PageViewWrapper } from "pages/AppViewer/AppPage.styled";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import {
  getAppSettingsPaneContext,
  getIsAppSettingsPaneWithNavigationTabOpen,
} from "selectors/appSettingsPaneSelectors";
import { AppSettingsTabs } from "../AppSettingsPane/AppSettings";
import SnapShotBannerCTA from "../CanvasLayoutConversion/SnapShotBannerCTA";
import { APP_MODE } from "entities/App";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import classNames from "classnames";
import { getSnapshotUpdatedTime } from "selectors/autoLayoutSelectors";
import { getReadableSnapShotDetails } from "layoutSystems/autolayout/utils/AutoLayoutUtils";
import AnonymousDataPopup from "../FirstTimeUserOnboarding/AnonymousDataPopup";
import {
  LayoutSystemFeatures,
  useLayoutSystemFeatures,
} from "layoutSystems/common/useLayoutSystemFeatures";
import OverlayCanvasContainer from "layoutSystems/common/WidgetNamesCanvas";
import { protectedModeSelector } from "selectors/gitSyncSelectors";
import { useCurrentAppState } from "pages/Editor/IDE/hooks";
import { EditorState } from "@appsmith/entities/IDE/constants";
import useMissingModuleNotification from "@appsmith/pages/Editor/IDE/MainPane/useMissingModuleNotification";

const BannerWrapper = styled.div`
  z-index: calc(var(--on-canvas-ui-z-index) + 1);
`;

function WidgetsEditor() {
  const dispatch = useDispatch();
  const currentPageId = useSelector(getCurrentPageId);
  const currentPageName = useSelector(getCurrentPageName);
  const currentApp = useSelector(getCurrentApplication);
  const isPreviewMode = useSelector(previewModeSelector);
  const isProtectedMode = useSelector(protectedModeSelector);
  const lastUpdatedTime = useSelector(getSnapshotUpdatedTime);
  const readableSnapShotDetails = getReadableSnapShotDetails(lastUpdatedTime);
  const isAutoLayout = useSelector(getIsAutoLayout);

  const currentApplicationDetails = useSelector(getCurrentApplication);
  const isAppSidebarPinned = useSelector(getAppSidebarPinned);
  const sidebarWidth = useSelector(getSidebarWidth);
  const appSettingsPaneContext = useSelector(getAppSettingsPaneContext);
  const navigationPreviewRef = useRef(null);
  const [navigationHeight, setNavigationHeight] = useState(0);
  const isNavigationSelectedInSettings = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const appState = useCurrentAppState();
  const isAppSettingsPaneWithNavigationTabOpen =
    appState === EditorState.SETTINGS && isNavigationSelectedInSettings;
  const canvasWidth = useSelector(getCanvasWidth);

  const appMode = useSelector(getAppMode);
  const isPublished = appMode === APP_MODE.PUBLISHED;
  const selectedTheme = useSelector(getSelectedAppTheme);
  const fontFamily = `${selectedTheme.properties.fontFamily.appFont}, sans-serif`;
  const isMobile = useIsMobileDevice();
  const isPreviewingNavigation =
    isPreviewMode || isProtectedMode || isAppSettingsPaneWithNavigationTabOpen;

  const shouldShowSnapShotBanner =
    !!readableSnapShotDetails && !isPreviewingNavigation;
  const missingModuleNotification = useMissingModuleNotification();

  const checkLayoutSystemFeatures = useLayoutSystemFeatures();

  const [enableOverlayCanvas] = checkLayoutSystemFeatures([
    LayoutSystemFeatures.ENABLE_CANVAS_OVERLAY_FOR_EDITOR_UI,
  ]);

  const layoutSystemType: LayoutSystemTypes = useSelector(getLayoutSystemType);
  const isAnvilLayout = layoutSystemType === LayoutSystemTypes.ANVIL;

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
    isProtectedMode,
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

  const handleWrapperClick = useCallback(
    (e: any) => {
      // This is a hack for widget name component clicks on Canvas.
      // For some reason the stopPropagation in the konva event listener isn't working
      // Also, the nodeName is available only for the konva event, so standard type definition
      // for onClick handlers don't work. Hence leaving the event type as any.
      const isCanvasWrapperClicked = e.target?.nodeName === "CANVAS";
      // Making sure that we don't deselect the widget
      // after we are done dragging the limits in auto height with limits
      if (
        allowDragToSelect &&
        !isAutoHeightWithLimitsChanging &&
        !isCanvasWrapperClicked
      ) {
        dispatch(setCanvasSelectionFromEditor(false));
      }
    },
    [allowDragToSelect, isAutoHeightWithLimitsChanging],
  );

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
      return <NavigationPreview ref={navigationPreviewRef} />;
    }
  };

  PerformanceTracker.stopTracking();
  return (
    <EditorContextProvider renderMode="CANVAS">
      <div className="relative flex flex-row h-full w-full overflow-hidden">
        <div
          className={classNames({
            "relative flex flex-col w-full overflow-hidden": true,
            "m-8 border border-gray-200":
              isAppSettingsPaneWithNavigationTabOpen,
          })}
        >
          {!isAppSettingsPaneWithNavigationTabOpen && (
            <EmptyCanvasPrompts isPreview={isPreviewMode || isProtectedMode} />
          )}
          {missingModuleNotification}
          <AnonymousDataPopup />
          <div
            className="relative flex flex-row h-full w-full overflow-hidden"
            data-testid="t--widgets-editor"
            draggable
            id="widgets-editor"
            onClick={handleWrapperClick}
            onDragStart={onDragStart}
            style={{
              fontFamily: fontFamily,
              contain: isAutoLayout ? "content" : "strict",
            }}
          >
            {showNavigation()}

            <PageViewWrapper
              className={classNames({
                "relative flex flex-row w-full justify-center": true,
                "select-none pointer-events-none":
                  isAppSettingsPaneWithNavigationTabOpen,
              })}
              hasPinnedSidebar={
                isPreviewingNavigation && !isMobile
                  ? currentApplicationDetails?.applicationDetail
                      ?.navigationSetting?.orientation ===
                      NAVIGATION_SETTINGS.ORIENTATION.SIDE && isAppSidebarPinned
                  : false
              }
              id={CANVAS_VIEWPORT}
              isPreview={isPreviewMode || isProtectedMode}
              isPublished={isPublished}
              sidebarWidth={isPreviewingNavigation ? sidebarWidth : 0}
              style={
                isAnvilLayout
                  ? {
                      //This is necessary in order to place WDS modal with position: fixed; relatively to the canvas.
                      transform: "scale(1)",
                    }
                  : {}
              }
            >
              {shouldShowSnapShotBanner && (
                <BannerWrapper className="absolute top-0 w-full">
                  <SnapShotBannerCTA />
                </BannerWrapper>
              )}
              <MainContainerWrapper
                canvasWidth={canvasWidth}
                currentPageId={currentPageId}
                isAppSettingsPaneWithNavigationTabOpen={
                  AppSettingsTabs.Navigation === appSettingsPaneContext?.type
                }
                isPreviewMode={isPreviewMode}
                isProtectedMode={isProtectedMode}
                navigationHeight={navigationHeight}
                shouldShowSnapShotBanner={shouldShowSnapShotBanner}
              />
              {enableOverlayCanvas && (
                <OverlayCanvasContainer canvasWidth={canvasWidth} />
              )}
            </PageViewWrapper>

            <CrudInfoModal />
          </div>
          <Debugger />
        </div>
      </div>
    </EditorContextProvider>
  );
}

export default WidgetsEditor;
