import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import MenuItemContainer from "./components/MenuItemContainer";
import MenuItem from "./components/MenuItem";
import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { get } from "lodash";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { Container } from "./TopInline.styled";
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

  return appPages.length > 1 ? (
    <Container className="flex gap-x-2 items-center">
      {appPages.map((page, index) => {
        const shouldShowDropdown = index === 4;

        if (shouldShowDropdown) {
          return (
            <MoreDropdownButton
              key="more-button"
              navigationSetting={currentApplicationDetails?.navigationSetting}
              pages={appPages}
            />
          );
        } else {
          return (
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
          );
        }
      })}
    </Container>
  ) : (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <></>
  );
}

export default TopInline;
