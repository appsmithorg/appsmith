import { ButtonVariant, ButtonVariantTypes } from "components/constants";
import { PublishedNavigationSetting } from "constants/AppConstants";
import styled from "styled-components";
import { StyledButton as Button } from "widgets/ButtonWidget/component";
import {
  getMenuItemBackgroundColorOnHover,
  getSignInButtonStyles,
} from "./utils";

const StyledButton = styled(Button)<{
  primaryColor: string;
  navColorStyle: PublishedNavigationSetting["colorStyle"];
  varient?: ButtonVariant;
}>`
  padding: 6px 12px;
  min-width: 2rem;
  line-height: 1.2;
  height: 2rem !important;
  transition: all 0.3s ease-in-out;
  box-shadow: none;

  span {
    max-width: 100%;
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

  // Secondary button styles (such as the sign in button)
  ${({ navColorStyle, primaryColor, varient }) => {
    const styles = getSignInButtonStyles(primaryColor, navColorStyle);

    const secondaryVarientStyles = `
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

    return varient === ButtonVariantTypes.SECONDARY
      ? secondaryVarientStyles
      : "";
  }}
`;

export default StyledButton;
