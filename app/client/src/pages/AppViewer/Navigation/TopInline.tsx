import { useLocation } from "react-router-dom";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWindowSizeHooks } from "utils/hooks/dragResizeHooks";
import MenuItem from "./components/MenuItem";
import { Container } from "./TopInline.styled";
import MenuItemContainer from "./components/MenuItemContainer";
import MoreDropdownButton from "./components/MoreDropdownButton";
import { getCanvasWidth } from "selectors/editorSelectors";
import { useSelector } from "react-redux";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { throttle } from "lodash";
import type { NavigationProps } from "./constants";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";

export function TopInline(props: NavigationProps) {
  const { currentApplicationDetails, pages } = props;
  const location = useLocation();
  const { pathname } = location;
  const [query, setQuery] = useState("");
  const navRef = useRef<HTMLDivElement>(null);
  const maxMenuItemWidth = 220;
  const [maxMenuItemsThatCanFit, setMaxMenuItemsThatCanFit] = useState(0);
  const { width: screenWidth } = useWindowSizeHooks();
  const isPreviewMode = useSelector(selectCombinedPreviewMode);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const isPreviewing = isPreviewMode || isAppSettingsPaneWithNavigationTabOpen;
  const canvasWidth = useSelector(getCanvasWidth);
  const THROTTLE_TIMEOUT = 50;

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

  useLayoutEffect(() => {
    const onResize = throttle(() => {
      if (navRef?.current) {
        const { offsetWidth } = navRef.current;

        // using max menu item width for simpler calculation
        setMaxMenuItemsThatCanFit(Math.floor(offsetWidth / maxMenuItemWidth));
      }
    }, THROTTLE_TIMEOUT);

    if (navRef.current) {
      const resizeObserver = new ResizeObserver(onResize);

      resizeObserver.observe(navRef.current);
      navRef.current.addEventListener("resize", onResize);
    }

    return () => {
      if (navRef.current) {
        navRef.current.removeEventListener("resize", onResize);
      }
    };
  }, [
    navRef,
    maxMenuItemWidth,
    appPages,
    screenWidth,
    isPreviewing,
    canvasWidth,
  ]);

  if (appPages.length <= 1) return null;

  return (
    <Container
      className="hidden md:flex gap-x-2 items-center grow t--app-viewer-navigation-top-inline"
      ref={navRef}
    >
      {appPages.map(
        (page, index) =>
          index < maxMenuItemsThatCanFit && (
            <MenuItemContainer
              isTabActive={pathname.indexOf(page.pageId) > -1}
              key={page.pageId}
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
          ),
      )}

      {appPages.length > maxMenuItemsThatCanFit && (
        <MoreDropdownButton
          key="more-button"
          navigationSetting={
            currentApplicationDetails?.applicationDetail?.navigationSetting
          }
          pages={appPages.slice(maxMenuItemsThatCanFit, appPages.length)}
          query={query}
        />
      )}
    </Container>
  );
}

export default TopInline;
