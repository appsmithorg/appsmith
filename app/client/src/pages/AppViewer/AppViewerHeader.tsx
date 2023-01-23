import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import styled, { ThemeProvider } from "styled-components";
import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { connect, useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import {
  getCurrentPageId,
  getViewModePageList,
  getCurrentPageDescription,
} from "selectors/editorSelectors";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import { Theme } from "constants/DefaultTheme";
import ProfileDropdown from "pages/common/ProfileDropdown";
import PageTabsContainer from "./PageTabsContainer";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import HtmlTitle from "./AppViewerHtmlTitle";
import PrimaryCTA from "./PrimaryCTA";
import PageMenu from "./PageMenu";
import TourCompletionMessage from "pages/Editor/GuidedTour/TourCompletionMessage";
import { useHref } from "pages/Editor/utils";
import { builderURL } from "RouteBuilder";
import { NavigationSetting, NAVIGATION_SETTINGS } from "constants/AppConstants";
import {
  getMenuContainerBackgroundColor,
  getMenuItemBackgroundColorWhenActive,
} from "./utils";
import { get } from "lodash";
import Sidebar from "./Navigation/Sidebar";
import ApplicationName from "./Navigation/components/ApplicationName";
import HeaderRightItemContainer from "./Navigation/components/HeaderRightItemContainer";
import MobileNavToggle from "./Navigation/components/MobileNavToggle";
import ShareButton from "./Navigation/components/ShareButton";

/**
 * ----------------------------------------------------------------------------
 * STYLED
 *-----------------------------------------------------------------------------
 */

const HeaderRow = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  width: 100%;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid
    ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorWhenActive(primaryColor, navColorStyle)};
`;

type AppViewerHeaderProps = {
  currentApplicationDetails?: ApplicationPayload;
  pages: Page[];
  currentWorkspaceId: string;
  currentUser?: User;
  lightTheme: Theme;
};

const StyledNav = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  background-color: ${({ navColorStyle, primaryColor }) =>
    getMenuContainerBackgroundColor(primaryColor, navColorStyle)};
`;

export function AppViewerHeader(props: AppViewerHeaderProps) {
  const selectedTheme = useSelector(getSelectedAppTheme);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
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
  const pageId = useSelector(getCurrentPageId);
  const editorURL = useHref(builderURL, { pageId });
  const navColorStyle =
    currentApplicationDetails?.navigationSetting?.colorStyle ||
    NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );
  const description = useSelector(getCurrentPageDescription);

  const renderNavigation = () => {
    if (
      currentApplicationDetails?.navigationSetting?.orientation ===
      NAVIGATION_SETTINGS.ORIENTATION.SIDE
    ) {
      return (
        <Sidebar
          appPages={pages}
          currentApplicationDetails={currentApplicationDetails}
          currentUser={currentUser}
          currentWorkspaceId={currentWorkspaceId}
        />
      );
    }

    return (
      <StyledNav
        className="relative js-appviewer-header"
        data-testid={"t--appsmith-app-viewer-header"}
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
        ref={headerRef}
      >
        <HtmlTitle
          description={description}
          name={currentApplicationDetails?.name}
        />
        <HeaderRow
          className="relative h-12 px-3 py-3 md:px-6"
          navColorStyle={navColorStyle}
          primaryColor={primaryColor}
        >
          <section className="flex items-center gap-3 z-1">
            <MobileNavToggle
              isMenuOpen={isMenuOpen}
              setMenuOpen={setMenuOpen}
            />
          </section>
          <div className="absolute top-0 bottom-0 flex items-center w-full mt-auto">
            <ApplicationName
              appName={currentApplicationDetails?.name || "Application Name"}
              navColorStyle={navColorStyle}
              primaryColor={primaryColor}
            />
          </div>
          <section className="relative flex items-center ml-auto space-x-3 z-1">
            {currentApplicationDetails && (
              <div className="hidden space-x-1 md:flex">
                {/* Since the Backend doesn't have navigationSetting field by default
                  and we are creating the default values only when any nav settings via the
                  settings pane has changed, we need to hide the share button ONLY when the showShareApp
                  setting is explicitly set to false by the user via the settings pane. */}
                {currentApplicationDetails?.navigationSetting?.showShareApp !==
                  false && (
                  <ShareButton
                    currentApplicationDetails={currentApplicationDetails}
                    currentWorkspaceId={currentWorkspaceId}
                  />
                )}

                <HeaderRightItemContainer>
                  <PrimaryCTA
                    className="t--back-to-editor"
                    navColorStyle={navColorStyle}
                    primaryColor={primaryColor}
                    url={editorURL}
                  />
                </HeaderRightItemContainer>
              </div>
            )}
            {currentUser && currentUser.username !== ANONYMOUS_USERNAME && (
              <HeaderRightItemContainer>
                <ProfileDropdown
                  modifiers={{
                    offset: {
                      enabled: true,
                      offset: `0, 0`,
                    },
                  }}
                  name={currentUser.name}
                  photoId={currentUser?.photoId}
                  userName={currentUser?.username || ""}
                />
              </HeaderRightItemContainer>
            )}
          </section>
        </HeaderRow>
        <PageTabsContainer
          currentApplicationDetails={currentApplicationDetails}
          pages={pages}
        />
      </StyledNav>
    );
  };

  if (hideHeader) return <HtmlTitle />;

  return (
    <ThemeProvider theme={props.lightTheme}>
      <>
        {renderNavigation()}

        <PageMenu
          application={currentApplicationDetails}
          headerRef={headerRef}
          isOpen={isMenuOpen}
          pages={pages}
          setMenuOpen={setMenuOpen}
          url={editorURL}
        />
        <TourCompletionMessage />
      </>
    </ThemeProvider>
  );
}

const mapStateToProps = (state: AppState): AppViewerHeaderProps => ({
  pages: getViewModePageList(state),
  currentApplicationDetails: state.ui.applications.currentApplication,
  currentWorkspaceId: getCurrentWorkspaceId(state),
  currentUser: getCurrentUser(state),
  lightTheme: getThemeDetails(state, ThemeMode.LIGHT),
});

export default connect(mapStateToProps)(AppViewerHeader);
