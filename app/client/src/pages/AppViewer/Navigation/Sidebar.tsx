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
import { getAppSidebarPinned } from "selectors/applicationSelectors";
import { setIsAppSidebarPinned } from "actions/applicationActions";
import {
  StyledCtaContainer,
  StyledFooter,
  StyledHeader,
  StyledMenuContainer,
  StyledSidebar,
} from "./Sidebar.styled";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import { AppSettingsTabs } from "pages/Editor/AppSettingsPane/AppSettings";
import { getAppSettingsPaneContext } from "selectors/appSettingsPaneSelectors";
import BackToHomeButton from "@appsmith/pages/AppViewer/BackToHomeButton";

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
    currentApplicationDetails?.navigationSetting?.colorStyle ||
    NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
  const isMinimal =
    currentApplicationDetails?.navigationSetting?.navStyle ===
    NAVIGATION_SETTINGS.NAV_STYLE.MINIMAL;
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
  const [query, setQuery] = useState("");
  const pageId = useSelector(getCurrentPageId);
  const editorURL = useHref(builderURL, { pageId });
  const dispatch = useDispatch();
  const isPinned = useSelector(getAppSidebarPinned);
  const [isOpen, setIsOpen] = useState(true);
  const { x } = useMouse();
  const theme = useSelector(getCurrentThemeDetails);
  const isPreviewMode = useSelector(previewModeSelector);
  const appSettingsPaneContext = useSelector(getAppSettingsPaneContext);
  const isAppSettingsPaneWithNavigationTabOpen =
    AppSettingsTabs.Navigation === appSettingsPaneContext?.type;

  useEffect(() => {
    setQuery(window.location.search);
  }, [location]);

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
        "is-open": isOpen,
        "shadow-xl": !isPinned,
      })}
      isMinimal={isMinimal}
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
      sidebarHeight={calculateSidebarHeight()}
    >
      <StyledHeader>
        {currentUser?.username !== ANONYMOUS_USERNAME && (
          <BackToHomeButton
            forSidebar
            navColorStyle={navColorStyle}
            primaryColor={primaryColor}
          />
        )}

        {!isMinimal && (
          <ApplicationName
            appName={currentApplicationDetails?.name}
            forSidebar
            navColorStyle={navColorStyle}
            primaryColor={primaryColor}
          />
        )}

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
        {pages.map((page) => {
          return (
            <MenuItem
              isMinimal={isMinimal}
              key={page.pageId}
              navigationSetting={currentApplicationDetails?.navigationSetting}
              page={page}
              query={query}
            />
          );
        })}
      </StyledMenuContainer>

      <StyledFooter>
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
