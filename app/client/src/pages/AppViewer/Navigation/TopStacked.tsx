import React, { useRef, useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import MenuItemContainer from "./components/MenuItemContainer";
import MenuItem from "./components/MenuItem";
import useThrottledRAF from "utils/hooks/useThrottledRAF";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { get } from "lodash";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { Container, ScrollBtnContainer } from "./TopStacked.styled";
import type { NavigationProps } from "./constants";

export function TopStacked(props: NavigationProps) {
  const { currentApplicationDetails, pages } = props;
  const selectedTheme = useSelector(getSelectedAppTheme);
  const navColorStyle =
    currentApplicationDetails?.applicationDetail?.navigationSetting
      ?.colorStyle || NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );
  const location = useLocation();
  const { pathname } = location;
  const [query, setQuery] = useState("");
  const tabsRef = useRef<HTMLElement | null>(null);
  const [tabsScrollable, setTabsScrollable] = useState(false);
  const [shouldShowLeftArrow, setShouldShowLeftArrow] = useState(false);
  const [shouldShowRightArrow, setShouldShowRightArrow] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isScrollingLeft, setIsScrollingLeft] = useState(false);

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

  if (appPages.length <= 1) return null;

  return (
    <Container
      className="relative hidden px-6 h-11 md:flex t--app-viewer-navigation-top-stacked"
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
    >
      {tabsScrollable && (
        <ScrollBtnContainer
          className="left-0 scroll-arrows"
          kind="tertiary"
          onMouseDown={() => startScrolling(true)}
          onMouseLeave={stopScrolling}
          onMouseUp={stopScrolling}
          onTouchEnd={stopScrolling}
          onTouchStart={() => startScrolling(true)}
          size="sm"
          startIcon="left-arrow-2"
          visible={shouldShowLeftArrow}
        />
      )}

      <div
        className="flex w-full hidden-scrollbar gap-x-2  items-center"
        onScroll={() => setShowScrollArrows()}
        ref={measuredTabsRef}
      >
        {appPages.map((page) => {
          return (
            <MenuItemContainer
              isTabActive={pathname.indexOf(page.pageId) > -1}
              key={page.pageId}
              setShowScrollArrows={setShowScrollArrows}
              tabsScrollable={tabsScrollable}
            >
              <MenuItem
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
      </div>

      {tabsScrollable && (
        <ScrollBtnContainer
          className="right-0 scroll-arrows"
          kind="tertiary"
          onMouseDown={() => startScrolling(false)}
          onMouseLeave={stopScrolling}
          onMouseUp={stopScrolling}
          onTouchEnd={stopScrolling}
          onTouchStart={() => startScrolling(false)}
          size="sm"
          startIcon="right-arrow-2"
          visible={shouldShowRightArrow}
        />
      )}
    </Container>
  );
}

export default TopStacked;
