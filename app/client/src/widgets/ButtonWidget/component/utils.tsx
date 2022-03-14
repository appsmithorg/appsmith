import { css } from "styled-components";

import { getHoverColor } from "widgets/WidgetUtils";
import { ButtonContainerProps } from "./DragContainer";

/*
  Created a css util so that we don't repeat our styles.
  Add more styles in the future also make sure you pass the 
  same props to the ButtonContainerProps, because we have to
  repeat on the button and the container.
*/

export const buttonHoverActiveStyles = css<ButtonContainerProps>`
  ${({ buttonColor, buttonVariant, disabled, loading }) => {
    const hoverColor = getHoverColor(buttonColor, buttonVariant);
    if (!disabled && !loading && hoverColor) {
      return ` 
        background: ${hoverColor} !important;
      `;
    }
  }}
`;
