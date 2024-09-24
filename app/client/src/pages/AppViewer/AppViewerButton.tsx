import type { ButtonVariant } from "components/constants";
import { ButtonVariantTypes } from "components/constants";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import styled from "styled-components";
import { StyledButton as Button } from "widgets/ButtonWidget/component";
import {
  getMenuItemBackgroundColorOnHover,
  getMenuItemTextColor,
  getSignInButtonStyles,
} from "./utils";
import { getTypographyByKey } from "@appsmith/ads-old";

const StyledButton = styled(Button)<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  varient?: ButtonVariant;
  insideSidebar?: boolean;
  isMinimal?: boolean;
}>`
  padding: 6px 12px;
  line-height: 1.2;
  transition: all 0.3s ease-in-out;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    max-width: 100%;
    color: ${({ navColorStyle, primaryColor }) =>
      getMenuItemTextColor(primaryColor, navColorStyle, true)} !important;
    transition: all 0.3s ease-in-out;
  }

  svg path {
    fill: ${({ navColorStyle, primaryColor }) =>
      getMenuItemTextColor(primaryColor, navColorStyle, true)};
    transition: all 0.3s ease-in-out;
  }

  &:hover,
  &:active,
  &:focus {
    background-color: ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorOnHover(
        primaryColor,
        navColorStyle,
      )} !important;

    span {
      ${({ navColorStyle, primaryColor }) => {
        if (navColorStyle !== NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
          return `color: ${getMenuItemTextColor(
            primaryColor,
            navColorStyle,
          )} !important`;
        }
      }};
    }

    svg path {
      ${({ navColorStyle, primaryColor }) => {
        if (navColorStyle !== NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
          return `fill: ${getMenuItemTextColor(primaryColor, navColorStyle)};`;
        }
      }};
    }
  }

  ${({ insideSidebar = false, isMinimal }) => {
    if (!insideSidebar) {
      return "";
    }

    return `
      padding: 8px 10px;
      gap: 10px;
      width: 100%;
      justify-content: ${isMinimal ? "center" : "flex-start"};

      .bp3-button-text {
        ${getTypographyByKey("h5")}
        font-weight: 400;
      }
    `;
  }}

  // Secondary button styles (such as the sign in button)
  ${({ insideSidebar = false, navColorStyle, primaryColor, varient }) => {
    const styles = getSignInButtonStyles(primaryColor, navColorStyle);

    let secondaryVarientStyles = `
      background-color: ${styles.background} !important;

      span {
        color: ${styles.color} !important;
      }

      svg path {
        fill: ${styles.color} !important;
      }

      &:hover,
      &:active,
      &:focus {
        background-color: ${styles.backgroundOnHover} !important;

        span {
          color: ${styles.color} !important;
        }

        svg path {
          fill: ${styles.color} !important;
        }
      }
    `;

    if (insideSidebar) {
      secondaryVarientStyles += `
        padding: 10px;
        justify-content: center;
      `;
    }

    return varient === ButtonVariantTypes.SECONDARY
      ? secondaryVarientStyles
      : "";
  }}
`;

export default StyledButton;
