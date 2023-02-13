import styled from "styled-components";

import { TextProps } from "./Text";

export const StyledText = styled.div.withConfig({
  shouldForwardProp: (prop, defaultValidatorFn) =>
    !["fontWeight", "fontStyle", "color"].includes(prop) &&
    defaultValidatorFn(prop),
})<TextProps>`
  height: 100%;
  width: 100%;
  color: ${({ color }) => color};
  font-weight: ${({ fontWeight }) => fontWeight};
  text-decoration: ${({ textDecoration }) => textDecoration};
  font-style: ${({ fontStyle }) => fontStyle};
  text-align: ${({ textAlign }) => textAlign};
`;
