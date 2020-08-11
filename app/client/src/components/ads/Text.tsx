import React from "react";
import styled from "styled-components";
import { ThemeProp } from "./Button";

export enum TextType {
  p1 = "p1",
  p2 = "p2",
  p3 = "p3",
  h1 = "h1",
  h2 = "h2",
  h3 = "h3",
  h4 = "h4",
  h5 = "h5",
  h6 = "h6",
}

export type TextProps = {
  type: TextType;
  underline?: boolean;
  italic?: boolean;
  children: string;
};

const typeSelector = (props: ThemeProp & TextProps): string => {
  let color = "";
  switch (props.type) {
    case TextType.p1:
      color = props.theme.colors.blackShades[6];
      break;
    case TextType.p2:
      color = props.theme.colors.blackShades[6];
      break;
    case TextType.p3:
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
  font-family: ${props => props.theme.fonts[3]};
  font-weight: ${props => props.theme.typography[props.type].fontWeight};
  font-size: ${props => props.theme.typography[props.type].fontSize}px;
  line-height: ${props => props.theme.typography[props.type].lineHeight}px;
  color: ${props => typeSelector(props)};
`;

Text.defaultProps = {
  type: TextType.p1,
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
