import { ButtonVariant, ButtonVariantTypes } from "components/constants";
import { NavigationSetting } from "constants/AppConstants";
import styled from "styled-components";
import { StyledButton as Button } from "widgets/ButtonWidget/component";
import {
  getMenuItemBackgroundColorOnHover,
  getMenuItemTextColor,
  getSignInButtonStyles,
} from "./utils";
import { getTypographyByKey } from "design-system-old";

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
  }

  &:hover,
  &:active,
  &:focus {
    background-color: ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorOnHover(
        primaryColor,
        navColorStyle,
      )} !important;
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

      &:hover,
      &:active, 
      &:focus {
        background-color: ${styles.backgroundOnHover} !important;
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
