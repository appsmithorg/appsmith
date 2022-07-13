import { createGlobalStyle } from "styled-components";

export const WidgetGlobaStyles = createGlobalStyle<{
  primaryColor?: string;
}>`
    :root{
      --wds-accent-color: ${({ primaryColor }) => primaryColor};
    }
  `;
