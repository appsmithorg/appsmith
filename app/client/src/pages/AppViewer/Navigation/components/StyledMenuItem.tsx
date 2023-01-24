import { NavigationSetting } from "constants/AppConstants";
import { getTypographyByKey } from "design-system-old";
import {
  getMenuItemBackgroundColorOnHover,
  getMenuItemBackgroundColorWhenActive,
  getMenuItemTextColor,
} from "pages/AppViewer/utils";
import { NavLink } from "react-router-dom";
import styled from "styled-components";

const StyledMenuItem = styled(NavLink)<{
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

  .page-icon svg path {
    fill: ${({ navColorStyle, primaryColor }) =>
      getMenuItemTextColor(primaryColor, navColorStyle, true)};
    stroke: ${({ navColorStyle, primaryColor }) =>
      getMenuItemTextColor(primaryColor, navColorStyle, true)};
    transition: all 0.3s ease-in-out;
  }

  &:hover {
    text-decoration: none;
    background-color: ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorOnHover(primaryColor, navColorStyle)};

    .page-icon svg path {
      fill: ${({ navColorStyle, primaryColor }) =>
        getMenuItemTextColor(primaryColor, navColorStyle)};
      stroke: ${({ navColorStyle, primaryColor }) =>
        getMenuItemTextColor(primaryColor, navColorStyle)};
    }
  }

  &.is-active {
    background-color: ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorWhenActive(primaryColor, navColorStyle)};

    .page-icon svg path {
      fill: ${({ navColorStyle, primaryColor }) =>
        getMenuItemTextColor(primaryColor, navColorStyle)};
      stroke: ${({ navColorStyle, primaryColor }) =>
        getMenuItemTextColor(primaryColor, navColorStyle)};
    }
  }
`;

const StyledMenuItemText = styled.div<{
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

export default StyledMenuItem;
export { StyledMenuItemText };
