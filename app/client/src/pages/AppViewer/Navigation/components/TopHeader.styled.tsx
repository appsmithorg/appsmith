import styled from "styled-components";
import { NavigationSetting } from "constants/AppConstants";
import {
  getMenuContainerBackgroundColor,
  getMenuItemBackgroundColorWhenActive,
} from "../../utils";

export const HeaderRow = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  width: 100%;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid
    ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorWhenActive(primaryColor, navColorStyle)};
`;

export const StyledNav = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  background-color: ${({ navColorStyle, primaryColor }) =>
    getMenuContainerBackgroundColor(primaryColor, navColorStyle)};
`;
