import React, { useEffect, useState } from "react";
import type {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { NAVIGATION_SETTINGS, SIDEBAR_WIDTH } from "constants/AppConstants";
import { get } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import ApplicationName from "./components/ApplicationName";
import MenuItem from "./components/MenuItem";
import ShareButton from "./components/ShareButton";
import PrimaryCTA from "../PrimaryCTA";
import { useHref } from "pages/Editor/utils";
import { builderURL } from "RouteBuilder";
import {
  getCurrentPageId,
  previewModeSelector,
} from "selectors/editorSelectors";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import SidebarProfileComponent from "./components/SidebarProfileComponent";
import CollapseButton from "./components/CollapseButton";
import classNames from "classnames";
import { useMouse } from "@mantine/hooks";
import { getAppSidebarPinned } from "@appsmith/selectors/applicationSelectors";
import { setIsAppSidebarPinned } from "@appsmith/actions/applicationActions";
import {
  StyledCtaContainer,
  StyledFooter,
  StyledHeader,
  StyledMenuContainer,
  StyledSidebar,
} from "./Sidebar.styled";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import BackToHomeButton from "@appsmith/pages/AppViewer/BackToHomeButton";
import MenuItemContainer from "./components/MenuItemContainer";

type SidebarProps = {
  currentApplicationDetails?: ApplicationPayload;
  pages: Page[];
  currentWorkspaceId: string;
  currentUser: User | undefined;
};

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
  const pageId = useSelector(getCurrentPageId);
  const editorURL = useHref(builderURL, { pageId });
  const dispatch = useDispatch();
  const isPinned = useSelector(getAppSidebarPinned);
  const [isOpen, setIsOpen] = useState(true);
  const { x } = useMouse();
  const theme = useSelector(getCurrentThemeDetails);
  const isPreviewMode = useSelector(previewModeSelector);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const [isLogoVisible, setIsLogoVisible] = useState(false);

  useEffect(() => {
    setQuery(window.location.search);
  }, [location]);

  // Mark default page as first page
  const appPages = pages;
  if (appPages.length > 1) {
    appPages.forEach((item, i) => {
      if (item.isDefault) {
        appPages.splice(i, 1);
        appPages.unshift(item);
      }
    });
  }

  useEffect(() => {
    setIsOpen(isPinned);
  }, [isPinned]);

  useEffect(() => {
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
  }, [x]);

  const setIsPinned = (isPinned: boolean) => {
    dispatch(setIsAppSidebarPinned(isPinned));
  };

  const calculateSidebarHeight = () => {
    let prefix = `calc( 100vh - `;
    const suffix = ")";

    if (isPreviewMode) {
      prefix += theme.smallHeaderHeight;
    } else if (isAppSettingsPaneWithNavigationTabOpen) {
      prefix += `${theme.smallHeaderHeight} - ${theme.bottomBarHeight}`;
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
        <div
          className={classNames({
            flex: true,
            "flex-col": isLogoVisible,
          })}
        >
          {currentUser?.username !== ANONYMOUS_USERNAME && (
            <BackToHomeButton
              forSidebar
              isLogoVisible={isLogoVisible}
              navColorStyle={navColorStyle}
              primaryColor={primaryColor}
              setIsLogoVisible={setIsLogoVisible}
            />
          )}

          {!isMinimal && (
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

      <StyledMenuContainer
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
      >
        {appPages.map((page) => {
          return (
            <MenuItemContainer
              forSidebar
              isTabActive={pathname.indexOf(page.pageId) > -1}
              key={page.pageId}
            >
              <MenuItem
                isMinimal={isMinimal}
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
          </StyledCtaContainer>
        )}

        <SidebarProfileComponent
          currentUser={currentUser}
          isMinimal={isMinimal}
          navColorStyle={navColorStyle}
          primaryColor={primaryColor}
        />
      </StyledFooter>
    </StyledSidebar>
  );
}

export default Sidebar;
