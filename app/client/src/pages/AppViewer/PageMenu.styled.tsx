import styled from "styled-components";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import {
  getMenuContainerBackgroundColor,
  getMenuItemBackgroundColorOnHover,
  getMenuItemBackgroundColorWhenActive,
  getMenuItemTextColor,
} from "./utils";
import { NavLink } from "react-router-dom";

export const PageMenuContainer = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  background-color: ${({ navColorStyle, primaryColor }) =>
    getMenuContainerBackgroundColor(primaryColor, navColorStyle)};

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
`;

export const StyledNavLink = styled(NavLink)<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  color: ${({ navColorStyle, primaryColor }) =>
    getMenuItemTextColor(primaryColor, navColorStyle, true)};
`;
