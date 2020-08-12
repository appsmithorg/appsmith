import React from "react";
import styled from "styled-components";
import { ThemeProp } from "./common";

export enum TextType {
  P1 = "p1",
  P2 = "p2",
  P3 = "p3",
  H1 = "h1",
  H2 = "h2",
  H3 = "h3",
  H4 = "h4",
  H5 = "h5",
  H6 = "h6",
}

export type TextProps = {
  type: TextType;
  underline?: boolean;
  italic?: boolean;
  children: string;
};

const typeSelector = (props: TextProps & ThemeProp): string => {
  let color = "";
  switch (props.type) {
    case TextType.P1:
      color = props.theme.colors.blackShades[6];
      break;
    case TextType.P2:
      color = props.theme.colors.blackShades[6];
      break;
    case TextType.P3:
      color = props.theme.colors.blackShades[6];
      break;
    default:
      color = props.theme.colors.blackShades[7];
      break;
  }
  return color;
};

const StyledText = styled("span")<TextProps>`
  text-decoration: ${props => (props.underline ? "underline" : "unset")};
  font-style: ${props => (props.italic ? "italic" : "normal")};
  font-family: ${props => props.theme.fonts[2]};
  font-weight: ${props => props.theme.typography[props.type].fontWeight};
  font-size: ${props => props.theme.typography[props.type].fontSize}px;
  line-height: ${props => props.theme.typography[props.type].lineHeight}px;
  letter-spacing: ${props =>
    props.theme.typography[props.type].letterSpacing}px;
  color: ${props => typeSelector(props)};
`;

Text.defaultProps = {
  type: TextType.P1,
  underline: false,
  italic: false,
};

/**
- Use this component for text styles from h1-h6 and p1-p3.
**/

function Text(props: TextProps) {
  return <StyledText {...props}>{props.children}</StyledText>;
}

export default Text;
