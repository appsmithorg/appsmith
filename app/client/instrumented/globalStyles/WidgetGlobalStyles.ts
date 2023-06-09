import { createGlobalStyle } from "styled-components";

export const WidgetGlobaStyles = createGlobalStyle<{
  primaryColor?: string;
  fontFamily?: string;
}>`
    :root{
      --wds-accent-color: ${({ primaryColor }) => primaryColor};
      --wds-font-family: ${({ fontFamily }) =>
        fontFamily === "System Default" ? "inherit" : fontFamily};
    }
  `;
