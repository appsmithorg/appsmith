import React, { useRef, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import styled from "styled-components";
import { get } from "lodash";
import type { ApplicationPayload } from "entities/Application";
import type { Page } from "entities/Page";
import { isEllipsisActive, trimQueryString } from "utils/helpers";
import { getTypographyByKey, TooltipComponent } from "@appsmith/ads-old";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { useHref } from "pages/Editor/utils";
import { APP_MODE } from "entities/App";
import { builderURL, viewerURL } from "ee/RouteBuilder";
import {
  getMenuItemBackgroundColorWhenActive,
  getMenuItemBackgroundColorOnHover,
  getMenuItemTextColor,
} from "./utils";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";

const PageTab = styled(NavLink)<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
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

const StyleTabText = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  ${getTypographyByKey("h6")}
  color: ${({ navColorStyle, primaryColor }) =>
    getMenuItemTextColor(primaryColor, navColorStyle, true)};
  height: ${(props) => `calc(${props.theme.pageTabsHeight})`};

  & span {
    height: 100%;
    max-width: 138px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    align-items: center;
  }

  ${PageTab}:hover &, ${PageTab}.is-active & {
    color: ${({ navColorStyle, primaryColor }) =>
      getMenuItemTextColor(primaryColor, navColorStyle)};
  }
`;

function PageTabName({
  name,
  navColorStyle,
  primaryColor,
}: {
  name: string;
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}) {
  const tabNameRef = useRef<HTMLSpanElement>(null);
  const [ellipsisActive, setEllipsisActive] = useState(false);
  const tabNameText = (
    <StyleTabText navColorStyle={navColorStyle} primaryColor={primaryColor}>
      <div className="relative flex items-center justify-center flex-grow">
        <span ref={tabNameRef}>{name}</span>
        {ellipsisActive && "..."}
      </div>
    </StyleTabText>
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
}

function PageTabContainer({
  children,
  isTabActive,
  setShowScrollArrows,
  tabsScrollable,
}: {
  children: React.ReactNode;
  isTabActive: boolean;
  tabsScrollable: boolean;
  setShowScrollArrows: () => void;
}) {
  const tabContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTabActive) {
      tabContainerRef.current?.scrollIntoView(false);
      setShowScrollArrows();
    }
  }, [isTabActive, tabsScrollable]);

  return <div ref={tabContainerRef}>{children}</div>;
}

interface Props {
  appPages: Page[];
  currentApplicationDetails?: ApplicationPayload;
  measuredTabsRef: (ref: HTMLElement | null) => void;
  tabsScrollable: boolean;
  setShowScrollArrows: () => void;
}

export function PageTabs(props: Props) {
  const { appPages, currentApplicationDetails } = props;
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
          <PageTabContainer
            isTabActive={pathname.indexOf(page.basePageId) > -1}
            key={page.pageId}
            setShowScrollArrows={props.setShowScrollArrows}
            tabsScrollable={props.tabsScrollable}
          >
            <PageTabItem
              navigationSetting={
                currentApplicationDetails?.applicationDetail?.navigationSetting
              }
              page={page}
              query={query}
            />
          </PageTabContainer>
        );
      })}
    </div>
  );
}

function PageTabItem({
  navigationSetting,
  page,
  query,
}: {
  page: Page;
  query: string;
  navigationSetting?: NavigationSetting;
}) {
  const appMode = useSelector(getAppMode);
  const pageURL = useHref(
    appMode === APP_MODE.PUBLISHED ? viewerURL : builderURL,
    { basePageId: page.basePageId },
  );
  const selectedTheme = useSelector(getSelectedAppTheme);
  const navColorStyle =
    navigationSetting?.colorStyle || NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;

  return (
    <PageTab
      activeClassName="is-active"
      className="t--page-switch-tab"
      navColorStyle={navColorStyle}
      primaryColor={get(
        selectedTheme,
        "properties.colors.primaryColor",
        "inherit",
      )}
      to={{
        pathname: trimQueryString(pageURL),
        search: query,
      }}
    >
      <PageTabName
        name={page.pageName}
        navColorStyle={navColorStyle}
        primaryColor={get(
          selectedTheme,
          "properties.colors.primaryColor",
          "inherit",
        )}
      />
    </PageTab>
  );
}

export default PageTabs;
