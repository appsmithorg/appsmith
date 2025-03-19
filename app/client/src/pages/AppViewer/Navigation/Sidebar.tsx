// React and core libraries
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";

// Third-party libraries
import { useMouse } from "@mantine/hooks";
import { useEventCallback } from "usehooks-ts";
import classNames from "classnames";
import { get } from "lodash";

// Application-specific imports
import { IDE_HEADER_HEIGHT } from "@appsmith/ads";
import { NAVIGATION_SETTINGS, SIDEBAR_WIDTH } from "constants/AppConstants";
import { BOTTOM_BAR_HEIGHT } from "components/BottomBar/constants";
import { builderURL } from "ee/RouteBuilder";
import { setIsAppSidebarPinned } from "ee/actions/applicationActions";
import NavigationLogo from "ee/pages/AppViewer/NavigationLogo";
import { getAppSidebarPinned } from "ee/selectors/applicationSelectors";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";
import {
  StyledCtaContainer,
  StyledFooter,
  StyledHeader,
  StyledMenuContainer,
  StyledSidebar,
} from "./Sidebar.styled";

// Type imports
import type { ApplicationPayload } from "entities/Application";
import type { Page } from "entities/Page";
import type { User } from "constants/userConstants";

// Utility/Helper functions
import { useHref } from "pages/Editor/utils";

// Imports with relative paths
import PrimaryCTA from "../PrimaryCTA";
import ApplicationName from "./components/ApplicationName";
import BackToAppsButton from "./components/BackToAppsButton";
import CollapseButton from "./components/CollapseButton";
import MenuItem from "./components/MenuItem";
import MenuItemContainer from "./components/MenuItemContainer";
import ShareButton from "./components/ShareButton";
import SidebarProfileComponent from "./components/SidebarProfileComponent";

interface SidebarProps {
  currentApplicationDetails?: ApplicationPayload;
  pages: Page[];
  currentWorkspaceId: string;
  currentUser: User | undefined;
  showUserSettings: boolean;
}

export function Sidebar(props: SidebarProps) {
  const selectedTheme = useSelector(getSelectedAppTheme);
  const { currentApplicationDetails, currentUser, currentWorkspaceId, pages } =
    props;
  const navColorStyle =
    currentApplicationDetails?.applicationDetail?.navigationSetting
      ?.colorStyle || NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
  const navStyle =
    currentApplicationDetails?.applicationDetail?.navigationSetting?.navStyle ||
    NAVIGATION_SETTINGS.NAV_STYLE.STACKED;
  const isMinimal =
    currentApplicationDetails?.applicationDetail?.navigationSetting
      ?.navStyle === NAVIGATION_SETTINGS.NAV_STYLE.MINIMAL;
  const logoConfiguration =
    currentApplicationDetails?.applicationDetail?.navigationSetting
      ?.logoConfiguration ||
    NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE;
  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );
  const borderRadius = get(
    selectedTheme,
    "properties.borderRadius.appBorderRadius",
    "inherit",
  );
  const location = useLocation();
  const { pathname } = location;
  const [query, setQuery] = useState("");
  const basePageId = useSelector(getCurrentBasePageId);
  const editorURL = useHref(builderURL, { basePageId });
  const dispatch = useDispatch();
  const isPinned = useSelector(getAppSidebarPinned);
  const [isOpen, setIsOpen] = useState(true);
  const { x } = useMouse();
  const isPreviewMode = useSelector(selectCombinedPreviewMode);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );

  useEffect(
    function updateQueryFromLocationEffect() {
      setQuery(window.location.search);
    },
    [location],
  );

  useEffect(
    function updateSidebarStateFromPinnedEffect() {
      setIsOpen(isPinned);
    },
    [isPinned],
  );

  useEffect(
    function handleSidebarVisibilityEffect() {
      // When the sidebar is unpinned -
      if (!isPinned) {
        if (x <= 20) {
          // 1. Open the sidebar when hovering on the left edge of the screen
          setIsOpen(true);
        } else if (x > SIDEBAR_WIDTH.REGULAR) {
          // 2. Close the sidebar when the mouse moves out of it
          setIsOpen(false);
        }
      }
    },
    [x, isPinned],
  );

  const setIsPinned = useEventCallback((isPinned: boolean) => {
    dispatch(setIsAppSidebarPinned(isPinned));
  });

  const calculateSidebarHeight = () => {
    let prefix = `calc( 100vh - `;
    const suffix = ")";

    if (isPreviewMode) {
      prefix += `${IDE_HEADER_HEIGHT}px - ${BOTTOM_BAR_HEIGHT}px`;
    } else if (isAppSettingsPaneWithNavigationTabOpen) {
      // We deduct 64px as well since it is the margin coming from "m-8" class from tailwind
      prefix += `${IDE_HEADER_HEIGHT}px - ${BOTTOM_BAR_HEIGHT}px - 64px`;
    } else {
      prefix += "0px";
    }

    return prefix + suffix;
  };

  return (
    <StyledSidebar
      className={classNames({
        "t--app-viewer-navigation-sidebar": true,
        "is-open": isOpen,
        "shadow-xl": !isPinned,
      })}
      isMinimal={isMinimal}
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
      sidebarHeight={calculateSidebarHeight()}
    >
      <StyledHeader>
        <div className="flex flex-col gap-5">
          <NavigationLogo logoConfiguration={logoConfiguration} />

          {!isMinimal &&
            (logoConfiguration ===
              NAVIGATION_SETTINGS.LOGO_CONFIGURATION
                .LOGO_AND_APPLICATION_TITLE ||
              logoConfiguration ===
                NAVIGATION_SETTINGS.LOGO_CONFIGURATION
                  .APPLICATION_TITLE_ONLY) && (
              <ApplicationName
                appName={currentApplicationDetails?.name}
                forSidebar
                navColorStyle={navColorStyle}
                navStyle={navStyle}
                primaryColor={primaryColor}
              />
            )}
        </div>

        {!isMinimal && (
          <CollapseButton
            borderRadius={borderRadius}
            isOpen={isOpen}
            isPinned={isPinned}
            navColorStyle={navColorStyle}
            primaryColor={primaryColor}
            setIsPinned={setIsPinned}
          />
        )}
      </StyledHeader>

      {pages.length > 1 && (
        <StyledMenuContainer
          navColorStyle={navColorStyle}
          primaryColor={primaryColor}
        >
          {pages.map((page) => {
            return (
              <MenuItemContainer
                forSidebar
                isTabActive={pathname.indexOf(page.pageId) > -1}
                key={page.pageId}
              >
                <MenuItem
                  key={page.pageId}
                  navigationSetting={
                    currentApplicationDetails?.applicationDetail
                      ?.navigationSetting
                  }
                  page={page}
                  query={query}
                />
              </MenuItemContainer>
            );
          })}
        </StyledMenuContainer>
      )}

      {props.showUserSettings && (
        <StyledFooter navColorStyle={navColorStyle} primaryColor={primaryColor}>
          {currentApplicationDetails && (
            <StyledCtaContainer>
              <ShareButton
                currentApplicationDetails={currentApplicationDetails}
                currentWorkspaceId={currentWorkspaceId}
                insideSidebar
                isMinimal={isMinimal}
              />

              <PrimaryCTA
                className="t--back-to-editor"
                insideSidebar
                isMinimal={isMinimal}
                navColorStyle={navColorStyle}
                primaryColor={primaryColor}
                url={editorURL}
              />

              <BackToAppsButton
                currentApplicationDetails={currentApplicationDetails}
                insideSidebar
                isMinimal={isMinimal}
              />
            </StyledCtaContainer>
          )}

          <SidebarProfileComponent
            currentUser={currentUser}
            isMinimal={isMinimal}
            navColorStyle={navColorStyle}
            primaryColor={primaryColor}
          />
        </StyledFooter>
      )}
    </StyledSidebar>
  );
}

export default Sidebar;
