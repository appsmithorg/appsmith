import type { Page } from "entities/Page";
import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { NavigationMethod } from "utils/history";
import useNavigateToAnotherPage from "../hooks/useNavigateToAnotherPage";
import MenuText from "./MenuText";
import { StyledMenuItemInDropdown } from "./MoreDropdownButton.styled";

interface MoreDropDownButtonItemProps {
  page: Page;
  query: string;
  borderRadius: string;
  primaryColor: string;
  navColorStyle: string;
}

const MoreDropDownButtonItem = ({
  borderRadius,
  navColorStyle,
  page,
  primaryColor,
  query,
}: MoreDropDownButtonItemProps) => {
  const location = useLocation();
  const navigateToAnotherPage = useNavigateToAnotherPage({
    basePageId: page.basePageId,
    query,
    state: { invokedBy: NavigationMethod.AppNavigation },
  });
  const handleClick = () => {
    navigateToAnotherPage();
  };
  const isActive = useMemo(
    () => location.pathname.indexOf(page.pageId) > -1,
    [location, page.pageId],
  );

  return (
    <StyledMenuItemInDropdown
      borderRadius={borderRadius}
      className={`t--app-viewer-navigation-top-inline-more-dropdown-item ${
        isActive ? "is-active" : ""
      }`}
      key={page.pageId}
      onClick={handleClick}
      primaryColor={primaryColor}
    >
      <MenuText
        name={page.pageName}
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
      />
    </StyledMenuItemInDropdown>
  );
};

export default MoreDropDownButtonItem;
