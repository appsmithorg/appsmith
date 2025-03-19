// React and core libraries
import React from "react";

// Third-party libraries
import classNames from "classnames";
import { useSelector } from "react-redux";

// Application-specific imports
import { APP_MODE } from "entities/App";
import { EditorState } from "IDE/enums";
import { useCurrentAppState } from "IDE/hooks/useCurrentAppState";
import { CANVAS_VIEWPORT } from "constants/componentClassNameConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { getAppMode } from "ee/selectors/entitiesSelector";
import {
  getAppSidebarPinned,
  getCurrentApplication,
} from "ee/selectors/applicationSelectors";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";
import { PageViewWrapper } from "pages/AppViewer/AppPage";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";

// Type imports
import type { ReactNode } from "react";

// Utility/Helper functions
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { useSidebarWidth } from "utils/hooks/useSidebarWidth";

/**
 * NavigationAdjustedPageViewer
 *
 * This component is used to provide proper layout for the layout system based editor in different modes like preview, published, and settings.
 */
export const NavigationAdjustedPageViewer = (props: {
  children: ReactNode;
}) => {
  const isPreview = useSelector(selectCombinedPreviewMode);
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const isAppSidebarPinned = useSelector(getAppSidebarPinned);
  const sidebarWidth = useSidebarWidth();
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
