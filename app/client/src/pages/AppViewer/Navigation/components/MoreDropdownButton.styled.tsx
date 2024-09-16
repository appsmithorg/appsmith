import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import type { NavigationSetting } from "constants/AppConstants";
import {
  getMenuItemBackgroundColorOnHover,
  getMenuItemBackgroundColorWhenActive,
  getMenuItemTextColor,
} from "pages/AppViewer/utils";
import styled from "styled-components";
import Button from "pages/AppViewer/AppViewerButton";
import { NavLink } from "react-router-dom";
import { Menu } from "@appsmith/ads-old";

export const StyleMoreDropdownButton = styled(Button)<{
  borderRadius: string;
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  display: flex;
  align-items: center;
  max-width: 220px;
  align-self: flex-end;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease-in-out;
  padding: 6px 10px;
  border-radius: ${({ borderRadius }) => borderRadius};
  background-color: transparent;

  & > span {
    width: 100%;
    display: flex;
    align-items: center;
  }

  &:hover {
    text-decoration: none;
    background-color: ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorOnHover(primaryColor, navColorStyle)};
    }
  }
`;

export const StyledMenuDropdownContainer = styled(Menu)<{
  borderRadius: string;
  primaryColor: string;
}>`
  .bp3-popover {
    border-radius: ${({ borderRadius }) =>
      `min(${borderRadius}, 0.375rem) !important`};
    overflow: hidden;
  }

  .bp3-popover-content {
    max-height: 550px;
    overflow-y: auto;
  }
`;

export const StyledMenuItemInDropdown = styled(NavLink)<{
  borderRadius: string;
  primaryColor: string;
}>`
  display: flex;
  align-items: center;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease-in-out;
  padding: 12px 16px;
  background-color: transparent;

  .menu-item-text {
    color: ${({ primaryColor }) =>
      getMenuItemTextColor(
        primaryColor,
        NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
        true,
      )};
    transition: all 0.3s ease-in-out;
  }

  &:hover {
    text-decoration: none;
    background-color: ${({ primaryColor }) =>
      getMenuItemBackgroundColorOnHover(
        primaryColor,
        NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
      )};

    .page-icon svg path {
      ${({ primaryColor }) => `
      fill: ${getMenuItemTextColor(
        primaryColor,
        NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
      )};
      stroke: ${getMenuItemTextColor(
        primaryColor,
        NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
      )};
    `};
    }
  }

  &.is-active {
    background-color: ${({ primaryColor }) =>
      getMenuItemBackgroundColorWhenActive(
        primaryColor,
        NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
      )};

    .menu-item-text {
      color: ${({ primaryColor }) =>
        getMenuItemTextColor(
          primaryColor,
          NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
        )};
    }

    .page-icon svg path {
      fill: ${({ primaryColor }) =>
        getMenuItemTextColor(
          primaryColor,
          NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
        )};
      stroke: ${({ primaryColor }) =>
        getMenuItemTextColor(
          primaryColor,
          NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
        )};
    }
  }

  .page-icon svg path {
    fill: ${({ primaryColor }) =>
      getMenuItemTextColor(
        primaryColor,
        NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
        true,
      )};
    stroke: ${({ primaryColor }) =>
      getMenuItemTextColor(
        primaryColor,
        NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
        true,
      )};
    transition: all 0.3s ease-in-out;
  }
`;
