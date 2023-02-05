import React, { useState } from "react";
import { NavigationSetting, NAVIGATION_SETTINGS } from "constants/AppConstants";
import { get } from "lodash";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { Icon } from "design-system-old";
import MenuText from "./MenuText";
import classNames from "classnames";
import {
  StyledMenuDropdownContainer,
  StyledMenuItemInDropdown,
  StyleMoreDropdownButton,
} from "./MoreDropdownButton.styled";
import { Page } from "@appsmith/constants/ReduxActionConstants";
import { getAppMode } from "selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { builderURL, viewerURL } from "RouteBuilder";
import { trimQueryString } from "utils/helpers";

type MoreDropdownButtonProps = {
  navigationSetting?: NavigationSetting;
  pages: Page[];
};

const MoreDropdownButton = ({
  navigationSetting,
  pages,
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
        navColorStyle={navColorStyle}
        onClick={() => {
          setIsOpen(true);
        }}
        primaryColor={primaryColor}
      >
        {navigationSetting?.itemStyle !==
          NAVIGATION_SETTINGS.ITEM_STYLE.TEXT && (
          <Icon
            className={classNames({
              "page-icon": true,
              "mr-2":
                navigationSetting?.itemStyle ===
                NAVIGATION_SETTINGS.ITEM_STYLE.TEXT_ICON,
            })}
            name="context-menu"
            size="large"
          />
        )}

        {navigationSetting?.itemStyle !==
          NAVIGATION_SETTINGS.ITEM_STYLE.ICON && (
          <>
            <MenuText
              name="More"
              navColorStyle={navColorStyle}
              primaryColor={primaryColor}
            />

            <Icon className="page-icon ml-2" name="expand-more" size="large" />
          </>
        )}
      </StyleMoreDropdownButton>
    </div>
  );

  return (
    <StyledMenuDropdownContainer
      closeOnItemClick
      isOpen={isOpen}
      navColorStyle={navColorStyle}
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
                pageId: page.pageId,
              })
            : builderURL({
                pageId: page.pageId,
              });

        return (
          <StyledMenuItemInDropdown
            borderRadius={borderRadius}
            key={page.pageId}
            navColorStyle={navColorStyle}
            primaryColor={primaryColor}
            to={{
              pathname: trimQueryString(pageURL),
            }}
          >
            {navigationSetting?.itemStyle !==
              NAVIGATION_SETTINGS.ITEM_STYLE.TEXT && (
              <Icon
                className={classNames({
                  "page-icon mr-2": true,
                })}
                name="file-line"
                size="large"
              />
            )}
            {navigationSetting?.itemStyle !==
              NAVIGATION_SETTINGS.ITEM_STYLE.ICON && (
              <MenuText
                name={page.pageName}
                navColorStyle={navColorStyle}
                primaryColor={primaryColor}
              />
            )}
          </StyledMenuItemInDropdown>
        );
      })}
    </StyledMenuDropdownContainer>
  );
};

export default MoreDropdownButton;
