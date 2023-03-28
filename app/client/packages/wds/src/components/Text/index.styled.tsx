import styled, { css } from "styled-components";

import type { TextProps } from "./Text";
import { createTypographyStyles } from "../../utils/typography";

const shouldForwardProp = (prop: any) => {
  const propsToOmit = [
    "fontWeight",
    "fontStyle",
    "color",
    "textAlign",
    "textDecoration",
  ];

  return !propsToOmit.includes(prop);
};

const typographyStyles = css`
  ${(props: TextProps) => {
    const { capHeight = 10, fontFamily, lineGap = 8 } = props;
    const styles = createTypographyStyles({ fontFamily, lineGap, capHeight });

    return styles;
  }}
`;

export const StyledText = styled.p.withConfig({ shouldForwardProp })<TextProps>`
  margin: 0;
  color: ${({ color }) => color};
  font-weight: ${({ fontWeight }) => fontWeight};
  text-decoration: ${({ textDecoration }) => textDecoration};
  font-style: ${({ fontStyle }) => fontStyle};
  text-align: ${({ textAlign }) => textAlign};

  ${typographyStyles}
`;
