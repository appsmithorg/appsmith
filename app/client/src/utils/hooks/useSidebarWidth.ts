// React and core libraries
import { useSelector } from "react-redux";

// Application-specific imports
import { getApplicationsState } from "ee/selectors/applicationSelectors";
import { NAVIGATION_SETTINGS, SIDEBAR_WIDTH } from "constants/AppConstants";
import { getCurrentPageId, getPageById } from "selectors/editorSelectors";

/**
 * Return the width of the sidebar depending on the sidebar style.
 * If there isn't any sidebar or it is unpinned, return 0.
 */
export const useSidebarWidth = () => {
  const applications = useSelector(getApplicationsState);
  const navigationSetting =
    applications.currentApplication?.applicationDetail?.navigationSetting;
  const isAppSidebarPinned = applications.isAppSidebarPinned;

  const currentPageId = useSelector(getCurrentPageId);
  const currentPage = useSelector(getPageById(currentPageId));

  if (
    navigationSetting?.showNavbar !== false &&
    currentPage?.isHidden === false &&
    navigationSetting?.orientation === NAVIGATION_SETTINGS.ORIENTATION.SIDE &&
    isAppSidebarPinned
  ) {
    if (navigationSetting?.navStyle === NAVIGATION_SETTINGS.NAV_STYLE.MINIMAL) {
      return SIDEBAR_WIDTH.MINIMAL;
    } else {
      return SIDEBAR_WIDTH.REGULAR;
    }
  }

  return 0;
};
