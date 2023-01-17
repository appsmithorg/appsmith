import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { Icon, IconSize } from "design-system";
import Navigation from "./Navigation";
import useThrottledRAF from "utils/hooks/useThrottledRAF";
import {
  PublishedNavigationSetting,
  NAVIGATION_SETTINGS,
} from "constants/AppConstants";
import { get } from "lodash";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getMenuContainerBackgroundColor, getMenuItemTextColor } from "./utils";

const Container = styled.div<{
  primaryColor: string;
  navColorStyle: PublishedNavigationSetting["colorStyle"];
}>`
  width: 100%;
  align-items: center;
  background-color: ${({ navColorStyle, primaryColor }) =>
    getMenuContainerBackgroundColor(primaryColor, navColorStyle)};
  border-bottom: 1px solid
    ${(props) => props.theme.colors.header.tabsHorizontalSeparator};

  & {
    .scroll-arrows svg path,
    .scroll-arrows svg:hover path {
      fill: ${({ navColorStyle, primaryColor }) =>
        getMenuItemTextColor(primaryColor, navColorStyle)};
      stroke: ${({ navColorStyle, primaryColor }) =>
        getMenuItemTextColor(primaryColor, navColorStyle)};
    }
  }
`;

const ScrollBtnContainer = styled.div<{
  visible: boolean;
  primaryColor: string;
  navColorStyle: PublishedNavigationSetting["colorStyle"];
}>`
  cursor: pointer;
  display: flex;
  position: absolute;
  height: 100%;
  padding: 0 10px;

  & > span {
    background: ${({ navColorStyle, primaryColor }) =>
      getMenuContainerBackgroundColor(primaryColor, navColorStyle)};
    position: relative;
    z-index: 1;
  }

  ${(props) =>
    props.visible
      ? `
      visibility: visible;
      opacity: 1;
      z-index: 1;
      transition: visibility 0s linear 0s, opacity 300ms;
    `
      : `
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s linear 300ms, opacity 300ms;
    `}
`;

type AppViewerHeaderProps = {
  currentApplicationDetails?: ApplicationPayload;
  pages: Page[];
};

export function PageTabsContainer(props: AppViewerHeaderProps) {
  const { currentApplicationDetails, pages } = props;
  const selectedTheme = useSelector(getSelectedAppTheme);
  // TODO - @Dhruvik - ImprovedAppNav
  // Use published and unpublished nav settings as needed
  const navColorStyle =
    currentApplicationDetails?.publishedNavigationSetting?.colorStyle ||
    NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );

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

  const tabsRef = useRef<HTMLElement | null>(null);
  const [tabsScrollable, setTabsScrollable] = useState(false);
  const [shouldShowLeftArrow, setShouldShowLeftArrow] = useState(false);
  const [shouldShowRightArrow, setShouldShowRightArrow] = useState(true);

  const setShowScrollArrows = useCallback(() => {
    if (tabsRef.current) {
      const { offsetWidth, scrollLeft, scrollWidth } = tabsRef.current;
      setShouldShowLeftArrow(scrollLeft > 0);
      setShouldShowRightArrow(scrollLeft + offsetWidth < scrollWidth);
    }
  }, [tabsRef.current]);

  const measuredTabsRef = useCallback((node) => {
    tabsRef.current = node;
    if (node !== null) {
      const { offsetWidth, scrollWidth } = node;
      setTabsScrollable(scrollWidth > offsetWidth);
      setShowScrollArrows();
    }
  }, []);

  const [isScrolling, setIsScrolling] = useState(false);
  const [isScrollingLeft, setIsScrollingLeft] = useState(false);

  const scroll = useCallback(() => {
    const currentOffset = tabsRef.current?.scrollLeft || 0;

    if (tabsRef.current) {
      tabsRef.current.scrollLeft = isScrollingLeft
        ? currentOffset - 5
        : currentOffset + 5;
      setShowScrollArrows();
    }
  }, [tabsRef.current, isScrollingLeft]);
  // eslint-disable-next-line
  const [_intervalRef, _rafRef, requestAF] = useThrottledRAF(scroll, 10);

  const stopScrolling = () => {
    setIsScrolling(false);
    setIsScrollingLeft(false);
  };

  const startScrolling = (isLeft: boolean) => {
    setIsScrolling(true);
    setIsScrollingLeft(isLeft);
  };

  useEffect(() => {
    let clear;
    if (isScrolling) {
      clear = requestAF();
    }
    return clear;
  }, [isScrolling, isScrollingLeft]);

  return appPages.length > 1 &&
    /**
     * Since the Backend doesn't have publishedNavigationSetting field by default
     * and we are creating the default values only when any nav settings via the
     * settings pane has changed, we need to hide the navbar ONLY when the showNavbar
     * setting is explicitly set to false by the user via the settings pane.
     */
    currentApplicationDetails?.publishedNavigationSetting?.showNavbar !==
      false ? (
    <Container
      className="relative hidden px-6 h-11 md:flex"
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
    >
      <ScrollBtnContainer
        className="left-0 scroll-arrows"
        navColorStyle={navColorStyle}
        onMouseDown={() => startScrolling(true)}
        onMouseLeave={stopScrolling}
        onMouseUp={stopScrolling}
        onTouchEnd={stopScrolling}
        onTouchStart={() => startScrolling(true)}
        primaryColor={primaryColor}
        visible={shouldShowLeftArrow}
      >
        <Icon name="left-arrow-2" size={IconSize.MEDIUM} />
      </ScrollBtnContainer>
      <Navigation
        appPages={appPages}
        currentApplicationDetails={currentApplicationDetails}
        measuredTabsRef={measuredTabsRef}
        setShowScrollArrows={setShowScrollArrows}
        tabsScrollable={tabsScrollable}
      />
      <ScrollBtnContainer
        className="right-0 scroll-arrows"
        navColorStyle={navColorStyle}
        onMouseDown={() => startScrolling(false)}
        onMouseLeave={stopScrolling}
        onMouseUp={stopScrolling}
        onTouchEnd={stopScrolling}
        onTouchStart={() => startScrolling(false)}
        primaryColor={primaryColor}
        visible={shouldShowRightArrow}
      >
        <Icon name="right-arrow-2" size={IconSize.MEDIUM} />
      </ScrollBtnContainer>
    </Container>
  ) : null;
}

export default PageTabsContainer;
