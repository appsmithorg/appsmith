import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import type { ApplicationPayload } from "entities/Application";
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import {
  getCurrentBasePageId,
  getViewModePageList,
} from "selectors/editorSelectors";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import type { User } from "constants/userConstants";
import type { Theme } from "constants/DefaultTheme";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import HtmlTitle from "../AppViewerHtmlTitle";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import PageMenu from "pages/AppViewer/PageMenu";
import { useHref } from "pages/Editor/utils";
import { builderURL } from "ee/RouteBuilder";
import TopHeader from "./components/TopHeader";
import Sidebar from "./Sidebar";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { setAppViewHeaderHeight } from "actions/appViewActions";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

export function Navigation() {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed") === "true";
  const showNavBar = queryParams.get("navbar") === "true";
  const hideHeader = isEmbed && !showNavBar;
  const [isMenuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const basePageId = useSelector(getCurrentBasePageId);
  const editorURL = useHref(builderURL, { basePageId });
  const currentWorkspaceId: string = useSelector(getCurrentWorkspaceId);
  const currentUser: User | undefined = useSelector(getCurrentUser);
  const lightTheme: Theme = useSelector((state: AppState) =>
    getThemeDetails(state, ThemeMode.LIGHT),
  );
  const currentApplicationDetails: ApplicationPayload | undefined = useSelector(
    getCurrentApplication,
  );
  const pages = useSelector(getViewModePageList);
  const isMobile = useIsMobileDevice();
  const dispatch = useDispatch();

  useEffect(() => {
    const header = document.querySelector(".js-appviewer-header");

    dispatch(setAppViewHeaderHeight(header?.clientHeight || 0));

    return () => {
      dispatch(setAppViewHeaderHeight(0));
    };
  }, [
    currentApplicationDetails?.applicationDetail?.navigationSetting?.navStyle,
    currentApplicationDetails?.applicationDetail?.navigationSetting
      ?.orientation,
  ]);
  useEffect(() => {
    if (showNavBar && currentApplicationDetails) {
      AnalyticsUtil.logEvent("APP_VIEWED_WITH_NAVBAR", {
        id: currentApplicationDetails.id,
      });
    }
  }, [showNavBar, currentApplicationDetails]);

  const renderNavigation = () => {
    if (
      currentApplicationDetails?.applicationDetail?.navigationSetting
        ?.orientation === NAVIGATION_SETTINGS.ORIENTATION.SIDE
    ) {
      return (
        <>
          {/*
           * We need to add top header since we want the current mobile
           * navigation experience until we create the new sidebar for mobile.
           */}
          {isMobile ? (
            <TopHeader
              currentApplicationDetails={currentApplicationDetails}
              currentUser={currentUser}
              currentWorkspaceId={currentWorkspaceId}
              isMenuOpen={isMenuOpen}
              pages={pages}
              setMenuOpen={setMenuOpen}
              showUserSettings={!isEmbed}
            />
          ) : (
            <Sidebar
              currentApplicationDetails={currentApplicationDetails}
              currentUser={currentUser}
              currentWorkspaceId={currentWorkspaceId}
              pages={pages}
              showUserSettings={!isEmbed}
            />
          )}
        </>
      );
    }

    return (
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
  };

  if (hideHeader) return <HtmlTitle />;

  return (
    <ThemeProvider theme={lightTheme}>
      <div ref={headerRef}>
        {/* Since the Backend doesn't have navigationSetting field by default
        and we are creating the default values only when any nav settings via the
        settings pane has changed, we need to hide the navbar ONLY when the showNavbar
        setting is explicitly set to false by the user via the settings pane. */}
        {currentApplicationDetails?.applicationDetail?.navigationSetting
          ?.showNavbar !== false && renderNavigation()}

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
