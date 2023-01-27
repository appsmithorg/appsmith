import React, { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { connect, useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import {
  getCurrentPageId,
  getViewModePageList,
} from "selectors/editorSelectors";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { User } from "constants/userConstants";
import { Theme } from "constants/DefaultTheme";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import HtmlTitle from "../AppViewerHtmlTitle";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import PageMenu from "pages/AppViewer/PageMenu";
import TourCompletionMessage from "pages/Editor/GuidedTour/TourCompletionMessage";
import { useHref } from "pages/Editor/utils";
import { builderURL } from "RouteBuilder";
import TopHeader from "./components/TopHeader";
import Sidebar from "./Sidebar";

type NavigationProps = {
  currentApplicationDetails?: ApplicationPayload;
  pages: Page[];
  currentWorkspaceId: string;
  currentUser?: User;
  lightTheme: Theme;
};

export function Navigation(props: NavigationProps) {
  const {
    currentApplicationDetails,
    currentUser,
    currentWorkspaceId,
    pages,
  } = props;
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed");
  const hideHeader = !!isEmbed;
  const [isMenuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const pageId = useSelector(getCurrentPageId);
  const editorURL = useHref(builderURL, { pageId });

  const renderNavigation = () => {
    if (
      currentApplicationDetails?.navigationSetting?.orientation ===
      NAVIGATION_SETTINGS.ORIENTATION.SIDE
    ) {
      return (
        <Sidebar
          currentApplicationDetails={currentApplicationDetails}
          currentUser={currentUser}
          currentWorkspaceId={currentWorkspaceId}
          pages={pages}
        />
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
      />
    );
  };

  if (hideHeader) return <HtmlTitle />;

  return (
    <ThemeProvider theme={props.lightTheme}>
      <div ref={headerRef}>
        {/* Since the Backend doesn't have navigationSetting field by default
        and we are creating the default values only when any nav settings via the
        settings pane has changed, we need to hide the navbar ONLY when the showNavbar
        setting is explicitly set to false by the user via the settings pane. */}
        {currentApplicationDetails?.navigationSetting?.showNavbar !== false &&
          renderNavigation()}

        <PageMenu
          application={currentApplicationDetails}
          headerRef={headerRef}
          isOpen={isMenuOpen}
          pages={pages}
          setMenuOpen={setMenuOpen}
          url={editorURL}
        />

        <TourCompletionMessage />
      </div>
    </ThemeProvider>
  );
}

const mapStateToProps = (state: AppState): NavigationProps => ({
  pages: getViewModePageList(state),
  currentApplicationDetails: state.ui.applications.currentApplication,
  currentWorkspaceId: getCurrentWorkspaceId(state),
  currentUser: getCurrentUser(state),
  lightTheme: getThemeDetails(state, ThemeMode.LIGHT),
});

export default connect(mapStateToProps)(Navigation);
