import { useLocation } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import { get } from "lodash";
import { useSelector } from "react-redux";
import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { useWindowSizeHooks } from "utils/hooks/dragResizeHooks";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import MenuItem from "./components/MenuItem";
import { Container } from "./TopInline.styled";
import MenuItemContainer from "./components/MenuItemContainer";
import MoreDropdownButton from "./components/MoreDropdownButton";

// TODO - @Dhruvik - ImprovedAppNav
// Replace with NavigationProps if nothing changes
// appsmith/app/client/src/pages/AppViewer/Navigation/constants.ts
type TopInlineProps = {
  currentApplicationDetails?: ApplicationPayload;
  pages: Page[];
};

export function TopInline(props: TopInlineProps) {
  const { currentApplicationDetails, pages } = props;
  const selectedTheme = useSelector(getSelectedAppTheme);
  const navColorStyle =
    currentApplicationDetails?.navigationSetting?.colorStyle ||
    NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );
  const location = useLocation();
  const { pathname } = location;
  const [query, setQuery] = useState("");
  const navRef = useRef(null);
  const maxMenuItemWidth = 220;
  const [maxMenuItemsThatCanFit, setMaxMenuItemsThatCanFit] = useState(0);
  const { width: screenWidth } = useWindowSizeHooks();

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
    if (navRef?.current) {
      const { offsetWidth } = navRef.current;

      // using max menu item width for simpler calculation
      setMaxMenuItemsThatCanFit(Math.floor(offsetWidth / maxMenuItemWidth));
    }
  }, [navRef, appPages, screenWidth]);

  if (appPages.length <= 1) return null;

  return (
    <Container className="flex gap-x-2 items-center" ref={navRef}>
      {appPages.map(
        (page, index) =>
          index < maxMenuItemsThatCanFit && (
            <MenuItemContainer
              isTabActive={pathname.indexOf(page.pageId) > -1}
              key={page.pageId}
            >
              <MenuItem
                navigationSetting={currentApplicationDetails?.navigationSetting}
                page={page}
                query={query}
              />
            </MenuItemContainer>
          ),
      )}

      {appPages.length > maxMenuItemsThatCanFit && (
        <MoreDropdownButton
          key="more-button"
          navigationSetting={currentApplicationDetails?.navigationSetting}
          pages={appPages.slice(maxMenuItemsThatCanFit, appPages.length)}
        />
      )}
    </Container>
  );
}

export default TopInline;
