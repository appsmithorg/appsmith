import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { get } from "lodash";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { NavigationMethod } from "utils/history";
import useNavigateToAnotherPage from "../../hooks/useNavigateToAnotherPage";
import { StyledMenuItem } from "../MenuItem.styled";
import MenuText from "../MenuText";
import type { MenuItemProps } from "./types";

const MenuItem = ({ navigationSetting, page, query }: MenuItemProps) => {
  const location = useLocation();

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

  const isActive = useMemo(
    () => location.pathname.indexOf(page.pageId) > -1,
    [location, page.pageId],
  );

  const handleClick = () => {
    navigateToAnotherPage();
  };

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
