import { NavigationSetting, NAVIGATION_SETTINGS } from "constants/AppConstants";
import {
  getMenuContainerBackgroundColor,
  getMenuItemBackgroundColorOnHover,
  getMenuItemBackgroundColorWhenActive,
  getMenuItemTextColor,
} from "pages/AppViewer/utils";
import styled from "styled-components";
import Button from "pages/AppViewer/AppViewerButton";
import { NavLink } from "react-router-dom";
import { Menu } from "design-system-old";

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
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  .bp3-popover {
    border-radius: ${({ borderRadius }) =>
      `min(${borderRadius}, 0.375rem) !important`};
    overflow: hidden;
  }

  .bp3-popover-content {
    max-height: 550px;
    overflow-y: auto;

    ${({ navColorStyle, primaryColor }) => {
      const isThemeColorStyle =
        navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.THEME;

      return (
        isThemeColorStyle &&
        `
          &::-webkit-scrollbar {
            width: 6px;
          }
        
          &::-webkit-scrollbar-track {
            background: ${getMenuContainerBackgroundColor(
              primaryColor,
              navColorStyle,
            )};
          }
        
          &::-webkit-scrollbar-thumb {
            background: ${primaryColor};
        
            &:hover {
              background: ${getMenuItemBackgroundColorOnHover(
                primaryColor,
                navColorStyle,
              )};
            }
          }
  
          &:hover::-webkit-scrollbar-thumb {
            background: ${getMenuItemBackgroundColorWhenActive(
              primaryColor,
              navColorStyle,
            )};
          }
        `
      );
    }}
  }

  .bp3-popover-content > div {
    background-color: ${({ navColorStyle, primaryColor }) =>
      getMenuContainerBackgroundColor(primaryColor, navColorStyle)} !important;
  }
`;

export const StyledMenuItemInDropdown = styled(NavLink)<{
  borderRadius: string;
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  display: flex;
  align-items: center;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease-in-out;
  padding: 12px 16px;
  background-color: transparent;

  &:hover {
    text-decoration: none;
    background-color: ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorOnHover(primaryColor, navColorStyle)};

    span {
      ${({ navColorStyle, primaryColor }) => {
        if (navColorStyle !== NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
          return `color: ${getMenuItemTextColor(
            primaryColor,
            navColorStyle,
          )} !important;`;
        }
      }};
    }

    .page-icon svg path {
      ${({ navColorStyle, primaryColor }) => {
        if (navColorStyle !== NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
          return `
            fill: ${getMenuItemTextColor(primaryColor, navColorStyle)};
            stroke: ${getMenuItemTextColor(primaryColor, navColorStyle)};
          `;
        }
      }};
    }
  }

  &.is-active {
    background-color: ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorWhenActive(primaryColor, navColorStyle)};

    span {
      color: ${({ navColorStyle, primaryColor }) =>
        getMenuItemTextColor(primaryColor, navColorStyle)} !important;
    }

    .page-icon svg path {
      fill: ${({ navColorStyle, primaryColor }) =>
        getMenuItemTextColor(primaryColor, navColorStyle)};
      stroke: ${({ navColorStyle, primaryColor }) =>
        getMenuItemTextColor(primaryColor, navColorStyle)};
    }
  }

  .page-icon svg path {
    fill: ${({ navColorStyle, primaryColor }) =>
      getMenuItemTextColor(primaryColor, navColorStyle, true)};
    stroke: ${({ navColorStyle, primaryColor }) =>
      getMenuItemTextColor(primaryColor, navColorStyle, true)};
    transition: all 0.3s ease-in-out;
  }
`;
