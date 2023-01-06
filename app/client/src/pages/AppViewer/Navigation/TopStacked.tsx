import React, { useRef, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import styled from "styled-components";
import { get } from "lodash";
import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { isEllipsisActive, trimQueryString } from "utils/helpers";
import { getTypographyByKey, TooltipComponent } from "design-system";
import { getAppMode } from "selectors/applicationSelectors";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { useHref } from "pages/Editor/utils";
import { APP_MODE } from "entities/App";
import { builderURL, viewerURL } from "RouteBuilder";
import {
  getMenuItemBackgroundColorWhenActive,
  getMenuItemBackgroundColorOnHover,
  getMenuItemTextColor,
} from "../utils";
import {
  NavigationSettingsColorStyle,
  NAVIGATION_SETTINGS,
} from "constants/AppConstants";

const StyledMenuItem = styled(NavLink)<{
  primaryColor: string;
  navColorStyle: NavigationSettingsColorStyle;
}>`
  display: flex;
  max-width: 170px;
  align-self: flex-end;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease-in-out;
  padding: 0 10px;
  border-radius: 4px;
  background-color: transparent;

  &:hover {
    text-decoration: none;
    background-color: ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorOnHover(primaryColor, navColorStyle)};
  }

  &.is-active {
    background-color: ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorWhenActive(primaryColor, navColorStyle)};
  }
`;

const StyledMenuItemText = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSettingsColorStyle;
}>`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  ${getTypographyByKey("h6")}
  color: ${({ navColorStyle, primaryColor }) =>
    getMenuItemTextColor(primaryColor, navColorStyle, true)};
  height: ${(props) => `calc(${props.theme.smallHeaderHeight})`};

  & span {
    height: 100%;
    max-width: 138px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    align-items: center;
  }

  ${StyledMenuItem}:hover &, ${StyledMenuItem}.is-active & {
    color: ${({ navColorStyle, primaryColor }) =>
      getMenuItemTextColor(primaryColor, navColorStyle)};
  }
`;

type MenuTextProps = {
  name: string;
  primaryColor: string;
  navColorStyle: NavigationSettingsColorStyle;
};

const MenuText = ({ name, navColorStyle, primaryColor }: MenuTextProps) => {
  const tabNameRef = useRef<HTMLSpanElement>(null);
  const [ellipsisActive, setEllipsisActive] = useState(false);
  const tabNameText = (
    <StyledMenuItemText
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
    >
      <div className="relative flex items-center justify-center flex-grow">
        <span ref={tabNameRef}>{name}</span>
        {ellipsisActive && "..."}
      </div>
    </StyledMenuItemText>
  );

  useEffect(() => {
    if (isEllipsisActive(tabNameRef?.current)) {
      setEllipsisActive(true);
    }
  }, [tabNameRef]);

  return (
    <TooltipComponent
      boundary="viewport"
      content={name}
      disabled={!ellipsisActive}
      maxWidth="400px"
      position="bottom"
    >
      {tabNameText}
    </TooltipComponent>
  );
};

type MenuContainerProps = {
  children: React.ReactNode;
  isTabActive: boolean;
  tabsScrollable: boolean;
  setShowScrollArrows: () => void;
};

const MenuContainer = ({
  children,
  isTabActive,
  setShowScrollArrows,
  tabsScrollable,
}: MenuContainerProps) => {
  const tabContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTabActive) {
      tabContainerRef.current?.scrollIntoView(false);
      setShowScrollArrows();
    }
  }, [isTabActive, tabsScrollable]);

  return <div ref={tabContainerRef}>{children}</div>;
};

type MenuItemProps = {
  page: Page;
  query: string;
};

const MenuItem = ({ page, query }: MenuItemProps) => {
  const appMode = useSelector(getAppMode);
  const pageURL = useHref(
    appMode === APP_MODE.PUBLISHED ? viewerURL : builderURL,
    { pageId: page.pageId },
  );
  const selectedTheme = useSelector(getSelectedAppTheme);
  // TODO - @Dhruvik - ImprovedAppNav
  // Fetch nav color style from the application's nav settings
  const navColorStyle = NAVIGATION_SETTINGS.COLOR_STYLE.SOLID;
  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );

  return (
    <StyledMenuItem
      activeClassName="is-active"
      className="t--page-switch-tab"
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
      to={{
        pathname: trimQueryString(pageURL),
        search: query,
      }}
    >
      <MenuText
        name={page.pageName}
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
      />
    </StyledMenuItem>
  );
};

// TODO - @Dhruvik - ImprovedAppNav
// Replace with NavigationProps if nothing changes
// appsmith/app/client/src/pages/AppViewer/Navigation/constants.ts
type TopStackedProps = {
  appPages: Page[];
  currentApplicationDetails?: ApplicationPayload;
  measuredTabsRef: (ref: HTMLElement | null) => void;
  tabsScrollable: boolean;
  setShowScrollArrows: () => void;
};

const TopStacked = (props: TopStackedProps) => {
  const { appPages } = props;
  const location = useLocation();
  const { pathname } = location;
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(window.location.search);
  }, [location]);

  return (
    <div
      className="flex w-full hidden-scrollbar gap-x-4"
      ref={props.measuredTabsRef}
    >
      {appPages.map((page) => {
        return (
          <MenuContainer
            isTabActive={pathname.indexOf(page.pageId) > -1}
            key={page.pageId}
            setShowScrollArrows={props.setShowScrollArrows}
            tabsScrollable={props.tabsScrollable}
          >
            <MenuItem page={page} query={query} />
          </MenuContainer>
        );
      })}
    </div>
  );
};

export default TopStacked;
