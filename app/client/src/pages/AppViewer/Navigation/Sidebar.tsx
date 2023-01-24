import React, { useEffect, useState } from "react";
import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import {
  NavigationSetting,
  NAVIGATION_SETTINGS,
  SIDEBAR_WIDTH,
} from "constants/AppConstants";
import { get } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import styled from "styled-components";
import {
  getMenuContainerBackgroundColor,
  getMenuItemBackgroundColorOnHover,
  getMenuItemBackgroundColorWhenActive,
} from "../utils";
import ApplicationName from "./components/ApplicationName";
import MenuItem from "./components/MenuItem";
import StyledMenuItem from "./components/StyledMenuItem";
import ShareButton from "./components/ShareButton";
import PrimaryCTA from "../PrimaryCTA";
import { useHref } from "pages/Editor/utils";
import { builderURL } from "RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import { User } from "constants/userConstants";
import SidebarProfileComponent from "./components/SidebarProfileComponent";
import CollapseButton from "./components/CollapseButton";
import classNames from "classnames";
import { useMouse } from "@mantine/hooks";
import { Colors } from "constants/Colors";
import { getSidebarPinned } from "selectors/applicationSelectors";
import { setIsSidebarPinned } from "actions/applicationActions";

const StyledSidebar = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  width: ${SIDEBAR_WIDTH.REGULAR}px;
  height: 100vh;
  background-color: ${({ navColorStyle, primaryColor }) =>
    getMenuContainerBackgroundColor(primaryColor, navColorStyle)};
  position: fixed;
  top: 0;
  left: -${SIDEBAR_WIDTH.REGULAR}px;
  transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${Colors.GRAY_300};

  &.is-open {
    left: 0;
  }
`;

const StyledMenuContainer = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  padding: 0 8px;
  flex-grow: 1;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ navColorStyle, primaryColor }) =>
      getMenuContainerBackgroundColor(primaryColor, navColorStyle)};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorWhenActive(primaryColor, navColorStyle)};

    &:hover {
      background: ${({ navColorStyle, primaryColor }) =>
        getMenuItemBackgroundColorOnHover(primaryColor, navColorStyle)};
    }
  }

  ${StyledMenuItem} {
    align-self: flex-start;
    width: 100%;
    max-width: initial;
    padding: 8px 10px;
  }
`;

const StyledCtaContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0px 8px;
`;

const StyledHeader = styled.div`
  padding: 16px 8px 0px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const StyledFooter = styled.div`
  margin-top: auto;
  padding-bottom: 16px;
`;

type SidebarProps = {
  currentApplicationDetails?: ApplicationPayload;
  pages: Page[];
  currentWorkspaceId: string;
  currentUser: User | undefined;
};

export function Sidebar(props: SidebarProps) {
  const selectedTheme = useSelector(getSelectedAppTheme);
  const {
    currentApplicationDetails,
    currentUser,
    currentWorkspaceId,
    pages,
  } = props;
  const navColorStyle =
    currentApplicationDetails?.navigationSetting?.colorStyle ||
    NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );
  const location = useLocation();
  const [query, setQuery] = useState("");
  const pageId = useSelector(getCurrentPageId);
  const editorURL = useHref(builderURL, { pageId });
  const dispatch = useDispatch();
  const isPinned = useSelector(getSidebarPinned);
  const [isOpen, setIsOpen] = useState(true);
  const { x } = useMouse();

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
    dispatch(setIsSidebarPinned(isPinned));
  };

  return (
    <StyledSidebar
      className={classNames({
        "is-open": isOpen,
        "shadow-xl": !isPinned,
      })}
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
    >
      <StyledHeader>
        <ApplicationName
          appName={currentApplicationDetails?.name || "Application Name"}
          forSidebar
          navColorStyle={navColorStyle}
          primaryColor={primaryColor}
        />

        <CollapseButton
          isPinned={isPinned}
          navColorStyle={navColorStyle}
          primaryColor={primaryColor}
          setIsPinned={setIsPinned}
        />
      </StyledHeader>

      <StyledMenuContainer
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
      >
        {pages.map((page) => {
          return (
            <MenuItem
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
            {currentApplicationDetails?.navigationSetting?.showShareApp !==
              false && (
              <ShareButton
                currentApplicationDetails={currentApplicationDetails}
                currentWorkspaceId={currentWorkspaceId}
                insideSidebar
              />
            )}

            <PrimaryCTA
              className="t--back-to-editor"
              insideSidebar
              navColorStyle={navColorStyle}
              primaryColor={primaryColor}
              url={editorURL}
            />
          </StyledCtaContainer>
        )}

        <SidebarProfileComponent
          currentUser={currentUser}
          navColorStyle={navColorStyle}
          primaryColor={primaryColor}
        />
      </StyledFooter>
    </StyledSidebar>
  );
}

export default Sidebar;
