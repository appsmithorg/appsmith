import { Icon } from "@appsmith/ads";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import type { Page } from "entities/Page";
import { get } from "lodash";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import MenuText from "./MenuText";
import {
  StyledMenuDropdownContainer,
  StyleMoreDropdownButton,
} from "./MoreDropdownButton.styled";
import MoreDropDownButtonItem from "./MoreDropDownButtonItem";

interface MoreDropdownButtonProps {
  navigationSetting?: NavigationSetting;
  pages: Page[];
  query: string;
}

const MoreDropdownButton = ({
  navigationSetting,
  pages,
  query,
}: MoreDropdownButtonProps) => {
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
  const [isOpen, setIsOpen] = useState(false);

  const TargetButton = (
    <div>
      <StyleMoreDropdownButton
        borderRadius={borderRadius}
        className="t--app-viewer-navigation-top-inline-more-button"
        navColorStyle={navColorStyle}
        onClick={() => {
          setIsOpen(true);
        }}
        primaryColor={primaryColor}
      >
        <>
          <MenuText
            name="More"
            navColorStyle={navColorStyle}
            primaryColor={primaryColor}
          />
          <Icon className="page-icon ml-2" name="expand-more" size="md" />
        </>
      </StyleMoreDropdownButton>
    </div>
  );

  return (
    <StyledMenuDropdownContainer
      autoFocus={false}
      borderRadius={borderRadius}
      className="t--app-viewer-navigation-top-inline-more-dropdown"
      closeOnItemClick
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
      }}
      position="bottom"
      primaryColor={primaryColor}
      target={TargetButton}
    >
      {pages.map((page) => {
        return (
          <MoreDropDownButtonItem
            borderRadius={borderRadius}
            key={page.pageId}
            navColorStyle={navColorStyle}
            page={page}
            primaryColor={primaryColor}
            query={query}
          />
        );
      })}
    </StyledMenuDropdownContainer>
  );
};

export default MoreDropdownButton;
