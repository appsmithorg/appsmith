import styled from "styled-components";
import { NavigationSetting, NAVIGATION_SETTINGS } from "constants/AppConstants";
import { getMenuContainerBackgroundColor } from "../../utils";

export const HeaderRow = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  width: 100%;
  display: flex;
  flex-direction: row;

  ${({ navColorStyle, theme }) => {
    const isLightColorStyle =
      navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;

    return isLightColorStyle
      ? `border-bottom: 1px solid ${theme.colors.header.tabsHorizontalSeparator}`
      : "";
  }}
`;

export const StyledNav = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  background-color: ${({ navColorStyle, primaryColor }) =>
    getMenuContainerBackgroundColor(primaryColor, navColorStyle)};
`;
