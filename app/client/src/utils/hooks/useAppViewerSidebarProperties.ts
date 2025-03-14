// React and core libraries
import { useLocation } from "react-router";

// Third-party libraries
import { useSelector } from "react-redux";

// Application-specific imports
import {
  getAppSidebarPinned,
  getCurrentApplication,
} from "ee/selectors/applicationSelectors";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";

// Utility/Helper functions
import { useSidebarWidth } from "utils/hooks/useSidebarWidth";

// Imports with relative paths
import { useIsMobileDevice } from "./useDeviceDetect";

export const useAppViewerSidebarProperties = () => {
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const isAppSidebarPinned = useSelector(getAppSidebarPinned);
  const isMobile = useIsMobileDevice();
  const _sidebarWidth = useSidebarWidth();

  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed");
  const isNavbarVisibleInEmbeddedApp = queryParams.get("navbar");
  const isEmbeddedAppWithNavVisible = isEmbed && isNavbarVisibleInEmbeddedApp;

  const hasSidebarPinned =
    currentApplicationDetails?.applicationDetail?.navigationSetting
      ?.orientation === NAVIGATION_SETTINGS.ORIENTATION.SIDE &&
    isAppSidebarPinned;

  const sidebarWidth =
    isMobile || (isEmbed && !isEmbeddedAppWithNavVisible) ? 0 : _sidebarWidth;

  return { hasSidebarPinned, sidebarWidth };
};
