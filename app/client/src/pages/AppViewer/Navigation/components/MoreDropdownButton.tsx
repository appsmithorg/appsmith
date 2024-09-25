import React, { useState } from "react";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { get } from "lodash";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { Icon } from "@appsmith/ads";
import MenuText from "./MenuText";
import {
  StyledMenuDropdownContainer,
  StyledMenuItemInDropdown,
  StyleMoreDropdownButton,
} from "./MoreDropdownButton.styled";
import type { Page } from "entities/Page";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { builderURL, viewerURL } from "ee/RouteBuilder";
import { trimQueryString } from "utils/helpers";
import { NavigationMethod } from "utils/history";

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
  const appMode = useSelector(getAppMode);
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
        const pageURL =
          appMode === APP_MODE.PUBLISHED
            ? viewerURL({
                basePageId: page.basePageId,
              })
            : builderURL({
                basePageId: page.basePageId,
              });

        return (
          <StyledMenuItemInDropdown
            activeClassName="is-active"
            borderRadius={borderRadius}
            className="t--app-viewer-navigation-top-inline-more-dropdown-item"
            key={page.pageId}
            primaryColor={primaryColor}
            to={{
              pathname: trimQueryString(pageURL),
              search: query,
              state: { invokedBy: NavigationMethod.AppNavigation },
            }}
          >
            <MenuText
              name={page.pageName}
              navColorStyle={navColorStyle}
              primaryColor={primaryColor}
            />
          </StyledMenuItemInDropdown>
        );
      })}
    </StyledMenuDropdownContainer>
  );
};

export default MoreDropdownButton;
