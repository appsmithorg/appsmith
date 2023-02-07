import { NavigationSetting } from "constants/AppConstants";
import { getTypographyByKey } from "design-system-old";
import { getMenuItemTextColor } from "pages/AppViewer/utils";
import styled from "styled-components";
import { StyledMenuItem } from "./MenuItem.styled";

export const StyledMenuItemText = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  ${getTypographyByKey("h5")}
  color: ${({ navColorStyle, primaryColor }) =>
    getMenuItemTextColor(primaryColor, navColorStyle, true)};
  transition: all 0.3s ease-in-out;
  font-weight: 400;

  & span {
    height: 100%;
    max-width: 162px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    align-items: center;
  }

  ${StyledMenuItem}:hover &, ${StyledMenuItem}.is-active & {
    color: ${({ navColorStyle, primaryColor }) =>
      getMenuItemTextColor(primaryColor, navColorStyle)};
  }
`;
