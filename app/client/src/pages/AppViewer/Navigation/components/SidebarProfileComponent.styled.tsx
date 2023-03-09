import styled from "styled-components";
import {
  getMenuItemBackgroundColorWhenActive,
  getMenuItemTextColor,
} from "pages/AppViewer/utils";
import { NavigationSetting, NAVIGATION_SETTINGS } from "constants/AppConstants";

export const StyledContainer = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  display: flex;
  align-items: center;
  padding: 12px 8px 0;
  margin-top: 12px;

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

export const StyledTextContainer = styled.div`
  margin-left: 8px;
`;

export const StyledText = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  isEmail?: boolean;
}>`
  color: ${({ navColorStyle, primaryColor }) =>
    getMenuItemTextColor(primaryColor, navColorStyle, true)};

  ${({ isEmail }) => {
    if (isEmail) {
      return `
        font-size: 12px;
      `;
    }
  }}
`;
