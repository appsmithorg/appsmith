import { NavigationSettingsColorStyle } from "constants/AppConstants";
import styled from "styled-components";

import { StyledButton as Button } from "widgets/ButtonWidget/component";
import {
  getMenuItemBackgroundColorOnHover,
  getSignInButtonStyles,
} from "./utils";

const StyledButton = styled(Button)<{
  primaryColor: string;
  navColorStyle: NavigationSettingsColorStyle;
  isSignInButton?: boolean;
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

  // Sign In Button Styles
  ${({ isSignInButton, navColorStyle, primaryColor }) => {
    const styles = getSignInButtonStyles(primaryColor, navColorStyle);

    const signInStyles = `
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

    return isSignInButton ? signInStyles : "";
  }}
`;

export default StyledButton;
