import React from "react";
import { IconName } from "./Icons";
import { CommonComponentProps } from "./common";
import styled from "styled-components";

type ButtonProps = CommonComponentProps & {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  text?: string;
  category?: "primary" | "secondary" | "tertiary"; //default primary
  variant?: "success" | "info" | "warning" | "danger" | "link"; //default info
  icon?: IconName; //default undefined.
  size?: "small" | "medium" | "large"; // default medium
};
// https://design.gitlab.com/components/button

const btnColorStyles = (
  props: any,
  primaryColor: string,
  secondaryColor: string,
  state = "main",
) => {
  let bgColor, txtColor, borderColor;
  switch (props.category) {
    case "primary":
      bgColor = props.theme.colors[props.variant][primaryColor];
      txtColor = props.theme.colors.blackShades[9];
      borderColor =
        state === "hover"
          ? `2px solid ${props.theme.colors[props.variant][primaryColor]}`
          : `2px solid ${props.theme.colors[props.variant].main}`;
      break;
    case "secondary":
      bgColor =
        state === "main"
          ? "transparent"
          : props.theme.colors[props.variant][secondaryColor];
      txtColor =
        state === "active"
          ? props.theme.colors[props.variant].light
          : props.theme.colors[props.variant].main;
      borderColor =
        state === "active"
          ? `2px solid ${props.theme.colors[props.variant].light}`
          : `2px solid ${props.theme.colors[props.variant].main}`;
      break;
  }
  return { bgColor, txtColor, borderColor };
};

const btnFontStyles = (props: any) => {
  let fontSize, fontWeight, lineHeight, letterSpacing, padding;
  switch (props.size) {
    case "small":
      fontSize = `${props.theme.fontSizes[1]}px`;
      fontWeight = props.theme.fontWeights[5];
      lineHeight = `${props.theme.lineHeights[1]}px`;
      letterSpacing = `${props.theme.letterSpacings[1]}px`;
      padding = `${props.theme.space[1]}px ${props.theme.space[2]}px`;
      break;
    case "medium":
      fontSize = `${props.theme.fontSizes[2]}px`;
      fontWeight = props.theme.fontWeights[5];
      lineHeight = `${props.theme.lineHeights[2]}px`;
      letterSpacing = `${props.theme.letterSpacings[2]}px`;
      padding = `${props.theme.space[3]}px ${props.theme.space[4]}px`;
      break;
    default:
      fontSize = `${props.theme.fontSizes[3]}px`;
      fontWeight = props.theme.fontWeights[5];
      lineHeight = `${props.theme.lineHeights[3]}px`;
      letterSpacing = `${props.theme.letterSpacings[2]}px`;
      padding = `${props.theme.space[5]}px ${props.theme.space[6]}px`;
      break;
  }
  return { fontSize, fontWeight, lineHeight, letterSpacing, padding };
};

const StyledButton = styled("button")`
  height: 100%;
  border: none;
  outline: none;
  text-transform: uppercase;;
  background-color: ${props => btnColorStyles(props, "main", "main").bgColor};
  color: ${props => btnColorStyles(props, "main", "main").txtColor};
  border: ${props => btnColorStyles(props, "main", "main").borderColor};
  border-radius: ${props => props.theme.radii[0]};
  font-size: ${props => btnFontStyles(props).fontSize};
  font-weight: ${props => btnFontStyles(props).fontWeight};
  line-height: ${props => btnFontStyles(props).lineHeight};
  letter-spacing: ${props => btnFontStyles(props).letterSpacing};
  padding: ${props => btnFontStyles(props).padding};
  &:hover {
    background-color: ${props =>
      btnColorStyles(props, "dark", "darker", "hover").bgColor}
    color: ${props =>
      btnColorStyles(props, "dark", "darker", "hover").txtColor};
    border: ${props =>
      btnColorStyles(props, "dark", "darker", "hover").borderColor};
  };
  &:active {
    background-color: ${props =>
      btnColorStyles(props, "dark", "darker", "active").bgColor}
    color: ${props =>
      btnColorStyles(props, "dark", "darker", "active").txtColor};
    border: ${props =>
      btnColorStyles(props, "dark", "darker", "active").borderColor};
  };
`;

function AdsButton(props: ButtonProps) {
  return (
    <StyledButton
      {...props}
      onClick={(e: React.MouseEvent<HTMLElement>) =>
        props.onClick && props.onClick(e)
      }
    >
      {props.text}
    </StyledButton>
  );
}

export default AdsButton;
