import type { ReactNode } from "react";
import React from "react";
import { EditorState } from "ee/entities/IDE/constants";
import { useCurrentAppState } from "pages/Editor/IDE/hooks";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { PageViewWrapper } from "pages/AppViewer/AppPage";
import classNames from "classnames";
import { APP_MODE } from "entities/App";
import { getAppMode } from "ee/selectors/entitiesSelector";
import {
  getAppSidebarPinned,
  getCurrentApplication,
  getSidebarWidth,
} from "ee/selectors/applicationSelectors";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { CANVAS_VIEWPORT } from "constants/componentClassNameConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";

/**
 * NavigationAdjustedPageViewer
 *
 * This component is used to provide proper layout for the layout system based editor in different modes like preview, published, and settings.
 */
export const NavigationAdjustedPageViewer = (props: {
  children: ReactNode;
}) => {
  const isPreview = useSelector(combinedPreviewModeSelector);
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const isAppSidebarPinned = useSelector(getAppSidebarPinned);
  const sidebarWidth = useSelector(getSidebarWidth);
  const isNavigationSelectedInSettings = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const appState = useCurrentAppState();
  const isAppSettingsPaneWithNavigationTabOpen =
    appState === EditorState.SETTINGS && isNavigationSelectedInSettings;

  const appMode = useSelector(getAppMode);
  const isPublished = appMode === APP_MODE.PUBLISHED;
  const isMobile = useIsMobileDevice();
  const isPreviewingNavigation =
    isPreview || isAppSettingsPaneWithNavigationTabOpen;
  const isAnvilLayout = useSelector(getIsAnvilLayout);

  return (
    <PageViewWrapper
      className={classNames({
        "relative flex flex-row w-full justify-center": true,
        "select-none pointer-events-none":
          isAppSettingsPaneWithNavigationTabOpen,
      })}
      hasPinnedSidebar={
        isPreviewingNavigation && !isMobile
          ? currentApplicationDetails?.applicationDetail?.navigationSetting
              ?.orientation === NAVIGATION_SETTINGS.ORIENTATION.SIDE &&
            isAppSidebarPinned
          : false
      }
      id={CANVAS_VIEWPORT}
      isPreview={isPreview}
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
      {props.children}
    </PageViewWrapper>
  );
};
