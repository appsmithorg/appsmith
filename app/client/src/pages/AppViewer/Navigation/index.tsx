// React and core libraries
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

// Third-party libraries
import { useDispatch, useSelector } from "react-redux";
import { ThemeProvider } from "styled-components";

// Type imports
import type { DefaultRootState } from "react-redux";
import type { ApplicationPayload } from "entities/Application";

// Application-specific imports
import { setAppViewHeaderHeight } from "actions/appViewActions";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { builderURL } from "ee/RouteBuilder";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import PageMenu from "pages/AppViewer/PageMenu";
import { useHref } from "pages/Editor/utils";
import {
  getCurrentBasePageId,
  getViewModePageList,
} from "selectors/editorSelectors";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";

// Relative imports
import HtmlTitle from "../AppViewerHtmlTitle";
import Sidebar from "./Sidebar";
import TopHeader from "./components/TopHeader";

export function Navigation() {
  const dispatch = useDispatch();
  const { search } = useLocation();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobileDevice();
  const basePageId = useSelector(getCurrentBasePageId);
  const editorURL = useHref(builderURL, { basePageId });

  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);
  const currentUser = useSelector(getCurrentUser);
  const lightTheme = useSelector((state: DefaultRootState) =>
    getThemeDetails(state, ThemeMode.LIGHT),
  );
  const currentApplicationDetails: ApplicationPayload | undefined = useSelector(
    getCurrentApplication,
  );
  const pages = useSelector(getViewModePageList);

  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed") === "true";
  const forceShowNavBar = queryParams.get("navbar") === "true";
  const hideHeader = isEmbed && !forceShowNavBar;

  const navStyle =
    currentApplicationDetails?.applicationDetail?.navigationSetting?.navStyle;
  const orientation =
    currentApplicationDetails?.applicationDetail?.navigationSetting
      ?.orientation;
  const applicationId = currentApplicationDetails?.id;

  const showNavbar =
    currentApplicationDetails?.applicationDetail?.navigationSetting?.showNavbar;

  // TODO: refactor this to not directly reference a DOM element by class defined elsewhere
  useEffect(
    function adjustHeaderHeightEffect() {
      const header = document.querySelector(".js-appviewer-header");

      dispatch(setAppViewHeaderHeight(header?.clientHeight || 0));

      return () => {
        dispatch(setAppViewHeaderHeight(0));
      };
    },
    [navStyle, orientation, dispatch],
  );

  useEffect(
    function trackNavbarAnalyticsEffect() {
      if (forceShowNavBar && applicationId) {
        AnalyticsUtil.logEvent("APP_VIEWED_WITH_NAVBAR", {
          id: applicationId,
        });
      }
    },
    [forceShowNavBar, applicationId],
  );

  const navigation = useMemo(() => {
    return orientation === NAVIGATION_SETTINGS.ORIENTATION.SIDE && !isMobile ? (
      <Sidebar
        currentApplicationDetails={currentApplicationDetails}
        currentUser={currentUser}
        currentWorkspaceId={currentWorkspaceId}
        pages={pages}
        showUserSettings={!isEmbed}
      />
    ) : (
      <TopHeader
        currentApplicationDetails={currentApplicationDetails}
        currentUser={currentUser}
        currentWorkspaceId={currentWorkspaceId}
        isMenuOpen={isMenuOpen}
        pages={pages}
        setMenuOpen={setMenuOpen}
        showUserSettings={!isEmbed}
      />
    );
  }, [
    currentApplicationDetails,
    currentUser,
    currentWorkspaceId,
    isEmbed,
    isMenuOpen,
    isMobile,
    orientation,
    pages,
  ]);

  if (hideHeader) return <HtmlTitle />;

  return (
    <ThemeProvider theme={lightTheme}>
      <div ref={headerRef}>
        {/* Since the Backend doesn't have navigationSetting field by default
        and we are creating the default values only when any nav settings via the
        settings pane has changed, we need to hide the navbar ONLY when the showNavbar
        setting is explicitly set to false by the user via the settings pane. */}
        {showNavbar && navigation}

        {/* Mobile Sidebar */}
        <PageMenu
          application={currentApplicationDetails}
          headerRef={headerRef}
          isOpen={isMenuOpen}
          pages={pages}
          setMenuOpen={setMenuOpen}
          url={editorURL}
        />
      </div>
    </ThemeProvider>
  );
}

export default Navigation;
