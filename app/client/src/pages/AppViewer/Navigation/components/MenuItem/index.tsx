import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { get } from "lodash";
import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation, useParams } from "react-router-dom";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { NavigationMethod } from "utils/history";
import useNavigateToAnotherPage from "../../hooks/useNavigateToAnotherPage";
import { StyledMenuItem } from "../MenuItem.styled";
import MenuText from "../MenuText";
import type { MenuItemProps } from "./types";

const MenuItem = ({ navigationSetting, page, query }: MenuItemProps) => {
  const location = useLocation();
  const params = useParams<{
    staticPageSlug?: string;
    staticApplicationSlug?: string;
    basePageId?: string;
  }>();

  const navigateToAnotherPage = useNavigateToAnotherPage({
    basePageId: page.basePageId,
    query,
    state: { invokedBy: NavigationMethod.AppNavigation },
  });
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

  const isActive = useMemo(() => {
    // Check if we're on a static URL route (both staticApplicationSlug and staticPageSlug must be present)
    const isStaticUrl = !!(
      params.staticApplicationSlug && params.staticPageSlug
    );

    if (isStaticUrl) {
      // For static URLs, check if the staticPageSlug matches the page's uniqueSlug
      return !!(page.uniqueSlug && page.uniqueSlug === params.staticPageSlug);
    } else {
      // For regular URLs, fall back to the older logic using indexOf
      return location.pathname.indexOf(page.pageId) > -1;
    }
  }, [
    params.staticApplicationSlug,
    params.staticPageSlug,
    page.uniqueSlug,
    page.pageId,
    location.pathname,
  ]);

  const handleClick = useCallback(() => {
    navigateToAnotherPage();
  }, [navigateToAnotherPage]);

  return (
    <StyledMenuItem
      borderRadius={borderRadius}
      className={`t--page-switch-tab ${isActive ? "is-active" : ""}`}
      navColorStyle={navColorStyle}
      onClick={handleClick}
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
