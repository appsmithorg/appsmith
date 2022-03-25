import { css } from "styled-components";

import { ButtonVariantTypes } from "components/constants";
import { getCustomHoverColor } from "widgets/WidgetUtils";
import { ButtonContainerProps } from "./DragContainer";

/*
  Created a css util so that we don't repeat our styles.
  Add more styles in the future also make sure you pass the
  same props to the ButtonContainerProps, because we have to
  repeat on the button and the container.
*/

export const buttonHoverActiveStyles = css<ButtonContainerProps>`
  ${({ buttonColor, buttonVariant, disabled, loading, theme }) => {
    if (!disabled && !loading) {
      return `
        background: ${
          getCustomHoverColor(theme, buttonVariant, buttonColor) !== "none"
            ? getCustomHoverColor(theme, buttonVariant, buttonColor)
            : buttonVariant === ButtonVariantTypes.SECONDARY
            ? theme.colors.button.primary.secondary.hoverColor
            : buttonVariant === ButtonVariantTypes.TERTIARY
            ? theme.colors.button.primary.tertiary.hoverColor
            : theme.colors.button.primary.primary.hoverColor
        } !important;
      `;
    }
  }}
`;
