import { useSelector } from "react-redux";
import { useLocation } from "react-router";

import {
  getAppSidebarPinned,
  getCurrentApplication,
  getSidebarWidth,
} from "ee/selectors/applicationSelectors";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { useIsMobileDevice } from "./useDeviceDetect";

export const useAppViewerSidebarProperties = () => {
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const isAppSidebarPinned = useSelector(getAppSidebarPinned);
  const isMobile = useIsMobileDevice();
  const _sidebarWidth = useSelector(getSidebarWidth);

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
