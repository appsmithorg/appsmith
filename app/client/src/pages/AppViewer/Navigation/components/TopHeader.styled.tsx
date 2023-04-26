import styled from "styled-components";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import type { NavigationSetting } from "constants/AppConstants";
import {
  getMenuContainerBackgroundColor,
  getMenuItemBackgroundColorWhenActive,
} from "../../utils";

export const HeaderRow = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  navStyle: NavigationSetting["navStyle"];
}>`
  width: 100%;
  display: flex;
  flex-direction: row;

  ${({ navColorStyle, navStyle, primaryColor, theme }) => {
    const isThemeColorStyle =
      navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.THEME;
    const isTopStackedNavStyle =
      navStyle === NAVIGATION_SETTINGS.NAV_STYLE.STACKED;

    if (isThemeColorStyle) {
      if (isTopStackedNavStyle) {
        return `
          border-bottom: 1px solid ${getMenuItemBackgroundColorWhenActive(
            primaryColor,
            navColorStyle,
          )};
        `;
      }

      return "";
    } else {
      return `
        border-bottom: 1px solid ${theme.colors.header.tabsHorizontalSeparator};
      `;
    }
  }}
`;

export const StyledNav = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  background-color: ${({ navColorStyle, primaryColor }) =>
    getMenuContainerBackgroundColor(primaryColor, navColorStyle)};
`;
