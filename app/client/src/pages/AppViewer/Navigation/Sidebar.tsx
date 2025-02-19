import React, { useEffect, useState } from "react";
import type { ApplicationPayload } from "entities/Application";
import type { Page } from "entities/Page";
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
import { builderURL } from "ee/RouteBuilder";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import type { User } from "constants/userConstants";
import SidebarProfileComponent from "./components/SidebarProfileComponent";
import CollapseButton from "./components/CollapseButton";
import classNames from "classnames";
import { useMouse } from "@mantine/hooks";
import { getAppSidebarPinned } from "ee/selectors/applicationSelectors";
import { setIsAppSidebarPinned } from "ee/actions/applicationActions";
import {
  StyledCtaContainer,
  StyledFooter,
  StyledHeader,
  StyledMenuContainer,
  StyledSidebar,
} from "./Sidebar.styled";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import NavigationLogo from "ee/pages/AppViewer/NavigationLogo";
import MenuItemContainer from "./components/MenuItemContainer";
import BackToAppsButton from "./components/BackToAppsButton";
import { IDE_HEADER_HEIGHT } from "@appsmith/ads";
import { BOTTOM_BAR_HEIGHT } from "components/BottomBar/constants";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";

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
