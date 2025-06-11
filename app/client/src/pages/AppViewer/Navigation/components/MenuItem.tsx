import React from "react";
import type { Page } from "entities/Page";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { APP_MODE } from "entities/App";
import { get } from "lodash";
import { useHref } from "pages/Editor/utils";
import { useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import { builderURL, viewerURL } from "ee/RouteBuilder";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { trimQueryString } from "utils/helpers";
import MenuText from "./MenuText";
import { StyledMenuItem } from "./MenuItem.styled";
import { NavigationMethod } from "utils/history";

interface MenuItemProps {
  page: Page;
  query: string;
  navigationSetting?: NavigationSetting;
  onBeforeNavigate?: (page: Page, url: string) => void | Promise<void>;
}

const MenuItem = ({ navigationSetting, page, query }: MenuItemProps) => {
  const history = useHistory();
  const appMode = useSelector(getAppMode);
  const pageURL = useHref(
    appMode === APP_MODE.PUBLISHED ? viewerURL : builderURL,
    { basePageId: page.basePageId },
  );
  const selectedTheme = useSelector(getSelectedAppTheme);
  const navColorStyle =
    navigationSetting?.colorStyle || NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
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

  // Check if this page is currently active
  const location = useLocation();
  const isActive = location.pathname.indexOf(page.pageId) > -1;

  const handleNavigationClick = async (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    e.preventDefault(); // Prevent default NavLink behavior

    try {
      // Execute custom function before navigation if provided

      // Perform programmatic navigation
      history.push({
        pathname: trimQueryString(pageURL),
        search: query,
        state: { invokedBy: NavigationMethod.AppNavigation },
      });
    } catch (error) {}
  };

  return (
    <StyledMenuItem
      as="a" // Use as anchor tag instead of NavLink
      borderRadius={borderRadius}
      className={`t--page-switch-tab ${isActive ? "is-active" : ""}`}
      href={trimQueryString(pageURL) + query} // Fallback href for accessibility
      navColorStyle={navColorStyle}
      onClick={handleNavigationClick}
      primaryColor={primaryColor}
    >
      <MenuText
        name={page.pageName}
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
      />
    </StyledMenuItem>
  );
};

export default MenuItem;
