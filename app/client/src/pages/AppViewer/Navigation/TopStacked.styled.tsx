import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import styled from "styled-components";
import {
  getMenuContainerBackgroundColor,
  getMenuItemTextColor,
} from "../utils";

export const Container = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  width: 100%;
  align-items: center;
  background-color: ${({ navColorStyle, primaryColor }) =>
    getMenuContainerBackgroundColor(primaryColor, navColorStyle)};

  ${({ navColorStyle, theme }) => {
    const isLightColorStyle =
      navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;

    if (isLightColorStyle) {
      return `
        border-bottom: 1px solid ${theme.colors.header.tabsHorizontalSeparator};
      `;
    }
  }}

  & {
    .scroll-arrows svg path,
    .scroll-arrows svg:hover path {
      fill: ${({ navColorStyle, primaryColor }) =>
        getMenuItemTextColor(primaryColor, navColorStyle, true)};
      stroke: ${({ navColorStyle, primaryColor }) =>
        getMenuItemTextColor(primaryColor, navColorStyle, true)};
    }
  }
`;

export const ScrollBtnContainer = styled.div<{
  visible: boolean;
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  cursor: pointer;
  display: flex;
  position: absolute;
  height: 100%;
  padding: 0 10px;

  & > span {
    background: ${({ navColorStyle, primaryColor }) =>
      getMenuContainerBackgroundColor(primaryColor, navColorStyle)};
    position: relative;
    z-index: 1;
  }

  ${(props) =>
    props.visible
      ? `
      visibility: visible;
      opacity: 1;
      z-index: 1;
      transition: visibility 0s linear 0s, opacity 300ms;
    `
      : `
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s linear 300ms, opacity 300ms;
    `}
`;
