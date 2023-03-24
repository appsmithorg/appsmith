import { NAVIGATION_SETTINGS, SIDEBAR_WIDTH } from "constants/AppConstants";
import type { NavigationSetting } from "constants/AppConstants";
import { Colors } from "constants/Colors";
import styled from "styled-components";
import {
  getMenuContainerBackgroundColor,
  getMenuItemBackgroundColorOnHover,
  getMenuItemBackgroundColorWhenActive,
} from "../utils";
import { StyledMenuItem } from "./components/MenuItem.styled";

export const StyledSidebar = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  isMinimal: boolean;
  sidebarHeight: string;
}>`
  height: ${({ sidebarHeight }) => sidebarHeight};
  background-color: ${({ navColorStyle, primaryColor }) =>
    getMenuContainerBackgroundColor(primaryColor, navColorStyle)};
  position: fixed;
  top: 0;
  transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${Colors.GRAY_300};

  ${({ isMinimal }) => {
    const width = isMinimal ? SIDEBAR_WIDTH.MINIMAL : SIDEBAR_WIDTH.REGULAR;

    return `
      width: ${width}px;
      left: -${width}px;
    `;
  }}

  &.is-open {
    left: 0;
  }
`;

export const StyledMenuContainer = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  margin: 16px 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  padding: 0 8px;
  flex-grow: 1;
  padding-bottom: 12px;

  ${({ navColorStyle, primaryColor }) => {
    const isThemeColorStyle: boolean =
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

  ${StyledMenuItem} {
    align-self: flex-start;
    width: 100%;
    max-width: initial;
    padding: 8px 10px;
  }
`;

export const StyledCtaContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0px 8px;
`;

export const StyledHeader = styled.div`
  padding: 16px 8px 0px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

export const StyledFooter = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  margin-top: auto;
  padding-bottom: 16px;
  padding-top: 12px;

  ${({ navColorStyle, primaryColor, theme }) => {
    const isThemeColorStyle =
      navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.THEME;

    return isThemeColorStyle
      ? `
        border-top: 1px solid ${getMenuItemBackgroundColorWhenActive(
          primaryColor,
          navColorStyle,
        )};
      `
      : `
        border-top: 1px solid ${theme.colors.header.tabsHorizontalSeparator};
      `;
  }}
`;
