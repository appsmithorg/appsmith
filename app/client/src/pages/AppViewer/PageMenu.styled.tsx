import styled from "styled-components";
import { NavigationSetting } from "constants/AppConstants";
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

  .page-list-container {
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: ${({ navColorStyle, primaryColor }) =>
        getMenuContainerBackgroundColor(primaryColor, navColorStyle)};
    }

    &::-webkit-scrollbar-thumb {
      background: ${({ navColorStyle, primaryColor }) =>
        getMenuItemBackgroundColorWhenActive(primaryColor, navColorStyle)};

      &:hover {
        background: ${({ navColorStyle, primaryColor }) =>
          getMenuItemBackgroundColorOnHover(primaryColor, navColorStyle)};
      }
    }
  }
`;

export const StyledNavLink = styled(NavLink)<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  color: ${({ navColorStyle, primaryColor }) =>
    getMenuItemTextColor(primaryColor, navColorStyle, true)};
`;
