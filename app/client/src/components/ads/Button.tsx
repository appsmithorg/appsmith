import React from "react";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import { IconName, Icon } from "./Icon";
import NewSpinner from "./NewSpinner";
import { AdSTheme } from "./baseTheme";

type ButtonProps = CommonComponentProps & {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  text?: string;
  category?: "primary" | "secondary" | "tertiary"; //default primary
  variant?: "success" | "info" | "warning" | "danger"; //default info
  icon?: IconName; //default undefined.
  size?: "small" | "medium" | "large"; // default medium
};
// https://design.gitlab.com/components/button

function hexToRgb(
  hex: string,
): {
  r: number;
  g: number;
  b: number;
} {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : {
        r: -1,
        g: -1,
        b: -1,
      };
}

// const darken = (color: Color, intensity: number) => {
//   return new tinycolor(color).darken(intensity).toString();
// };

// const lighten = (color: Color, intensity: number) => {
//   return new tinycolor(color).lighten(intensity).toString();
// };

const rgbaIntensity = (color: string) => {
  const value = hexToRgb(color);
  return `rgba(${value.r}, ${value.g}, ${value.b}, 0.1);`;
};

const stateStyles = (
  props: { theme: AdSTheme } & ButtonProps,
  state: string,
) => {
  let bgColorPrimary,
    borderColorPrimary,
    txtColorPrimary,
    bgColorSecondary,
    borderColorSecondary,
    txtColorSecondary,
    bgColorTertiary,
    borderColorTertiary,
    txtColorTertiary;

  if (props.isLoading || props.isDisabled) {
    switch (props.category) {
      case "primary":
        if (props.variant) {
          bgColorPrimary = props.theme.colors[props.variant].darkest;
          borderColorPrimary = props.theme.colors[props.variant].darkest;
          txtColorPrimary = props.theme.colors.blackShades[6];
        }
        break;
      case "secondary":
        if (props.variant) {
          bgColorSecondary = props.theme.colors[props.variant].darkest;
          borderColorSecondary = props.theme.colors[props.variant].darker;
          txtColorSecondary = props.theme.colors.blackShades[6];
        }
        break;
      default:
        bgColorTertiary = props.theme.colors.tertiary.darkest;
        borderColorTertiary = props.theme.colors.tertiary.darker;
        txtColorTertiary = props.theme.colors.blackShades[6];
        break;
    }
  } else if (state === "main") {
    switch (props.category) {
      case "primary":
        if (props.variant) {
          bgColorPrimary = props.theme.colors[props.variant].main;
          txtColorPrimary = props.theme.colors.blackShades[9];
          borderColorPrimary = props.theme.colors[props.variant].main;
        }
        break;
      case "secondary":
        if (props.variant) {
          bgColorSecondary = "transparent";
          borderColorSecondary = props.theme.colors[props.variant].main;
          txtColorSecondary = props.theme.colors[props.variant].main;
        }
        break;
      default:
        bgColorTertiary = "transparent";
        borderColorTertiary = props.theme.colors.tertiary.main;
        txtColorTertiary = props.theme.colors.tertiary.main;
        break;
    }
  } else if (state === "hover") {
    switch (props.category) {
      case "primary":
        if (props.variant) {
          bgColorPrimary = props.theme.colors[props.variant].dark;
          txtColorPrimary = props.theme.colors.blackShades[9];
          borderColorPrimary = props.theme.colors[props.variant].dark;
        }
        break;
      case "secondary":
        if (props.variant) {
          bgColorSecondary = rgbaIntensity(
            props.theme.colors[props.variant].main,
          );
          txtColorSecondary = props.theme.colors[props.variant].main;
          borderColorSecondary = props.theme.colors[props.variant].main;
        }
        break;
      default:
        bgColorTertiary = rgbaIntensity(props.theme.colors.tertiary.main);
        borderColorTertiary = props.theme.colors.tertiary.main;
        txtColorTertiary = props.theme.colors.tertiary.main;
        break;
    }
  } else if (state === "active") {
    switch (props.category) {
      case "primary":
        if (props.variant) {
          bgColorPrimary = props.theme.colors[props.variant].dark;
          txtColorPrimary = props.theme.colors.blackShades[9];
          borderColorPrimary = props.theme.colors[props.variant].main;
        }
        break;
      case "secondary":
        if (props.variant) {
          bgColorSecondary = rgbaIntensity(
            props.theme.colors[props.variant].main,
          );
          txtColorSecondary = props.theme.colors[props.variant].light;
          borderColorSecondary = props.theme.colors[props.variant].light;
        }
        break;
      default:
        bgColorTertiary = rgbaIntensity(props.theme.colors.tertiary.main);
        borderColorTertiary = props.theme.colors.tertiary.light;
        txtColorTertiary = props.theme.colors.tertiary.light;
        break;
    }
  }

  return {
    bgColorPrimary,
    borderColorPrimary,
    txtColorPrimary,
    bgColorSecondary,
    borderColorSecondary,
    txtColorSecondary,
    bgColorTertiary,
    borderColorTertiary,
    txtColorTertiary,
  };
};

const btnColorStyles = (
  props: { theme: AdSTheme } & ButtonProps,
  state: string,
) => {
  let bgColor, txtColor, borderColor;
  switch (props.category) {
    case "primary":
      bgColor = stateStyles(props, state).bgColorPrimary;
      txtColor = stateStyles(props, state).txtColorPrimary;
      borderColor = `2px solid ${stateStyles(props, state).borderColorPrimary}`;
      break;
    case "secondary":
      bgColor = stateStyles(props, state).bgColorSecondary;
      txtColor = stateStyles(props, state).txtColorSecondary;
      borderColor = `2px solid ${
        stateStyles(props, state).borderColorSecondary
      }`;
      break;
    case "tertiary":
      bgColor = stateStyles(props, state).bgColorTertiary;
      txtColor = stateStyles(props, state).txtColorTertiary;
      borderColor = `2px solid ${
        stateStyles(props, state).borderColorTertiary
      }`;
  }
  return { bgColor, txtColor, borderColor };
};

const btnFontStyles = (props: { theme: AdSTheme } & ButtonProps) => {
  let fontSize, fontWeight, lineHeight, letterSpacing, padding;
  switch (props.size) {
    case "small":
      fontSize = `${props.theme.fontSizes[1]}px`;
      fontWeight = props.theme.fontWeights[5];
      lineHeight = `${props.theme.lineHeights[1]}px`;
      letterSpacing = `${props.theme.letterSpacings[1]}px`;
      padding =
        !props.text && props.icon
          ? `${props.theme.space[12]}px ${props.theme.space[12]}px`
          : `${props.theme.space[8]}px ${props.theme.space[2]}px ${props.theme.space[1]}px`;
      break;
    case "medium":
      fontSize = `${props.theme.fontSizes[2]}px`;
      fontWeight = props.theme.fontWeights[5];
      lineHeight = `${props.theme.lineHeights[2]}px`;
      letterSpacing = `${props.theme.letterSpacings[2]}px`;
      padding =
        !props.text && props.icon
          ? `${props.theme.space[13]}px ${props.theme.space[13]}px`
          : `${props.theme.space[3]}px ${props.theme.space[4]}px`;
      break;
    default:
      fontSize = `${props.theme.fontSizes[3]}px`;
      fontWeight = props.theme.fontWeights[5];
      lineHeight = `${props.theme.lineHeights[3]}px`;
      letterSpacing = `${props.theme.letterSpacings[2]}px`;
      padding =
        !props.text && props.icon
          ? `${props.theme.space[14]}px ${props.theme.space[14]}px`
          : `${props.theme.space[5]}px ${props.theme.space[6]}px`;
      break;
  }
  return { fontSize, fontWeight, lineHeight, letterSpacing, padding };
};

const iconColorHandler = (props: { theme: AdSTheme } & ButtonProps) => {
  let iconColor: string;
  if (props.isLoading || props.isDisabled) {
    iconColor = props.theme.colors.blackShades[6];
  } else {
    switch (props.category) {
      case "primary":
        iconColor = props.theme.colors.blackShades[9];
        break;
      case "secondary":
        iconColor = props.variant ? props.theme.colors[props.variant].main : "";
        break;
      default:
        iconColor = props.theme.colors.tertiary.light;
    }
  }
  return iconColor;
};

const StyledButton = styled("button")<ButtonProps>`
  border: none;
  outline: none;
  text-transform: uppercase;;
  background-color: ${props => {
    console.log(".................", props);
    return btnColorStyles(props, "main").bgColor;
  }};
  color: ${props => btnColorStyles(props, "main").txtColor};
  border: ${props => btnColorStyles(props, "main").borderColor};
  border-radius: ${props => props.theme.radii[0]};
  font-size: ${props => btnFontStyles(props).fontSize};
  font-weight: ${props => btnFontStyles(props).fontWeight};
  line-height: ${props => btnFontStyles(props).lineHeight};
  font-family: ${props => props.theme.fonts.main};
  letter-spacing: ${props => btnFontStyles(props).letterSpacing};
  padding: ${props => btnFontStyles(props).padding};
  &:hover {
    background-color: ${props => btnColorStyles(props, "hover").bgColor}
    color: ${props => btnColorStyles(props, "hover").txtColor};
    border: ${props => btnColorStyles(props, "hover").borderColor};
    cursor: ${props =>
      props.isLoading || props.isDisabled ? `not-allowed` : `pointer`};
  };
  font-style: normal;
  &:active {
    background-color: ${props => btnColorStyles(props, "active").bgColor}
    color: ${props => btnColorStyles(props, "active").txtColor};
    border: ${props => btnColorStyles(props, "active").borderColor};
    cursor:  ${props =>
      props.isLoading || props.isDisabled ? `not-allowed` : `pointer`};
  };
  span {
    margin-right: ${props =>
      props.text && props.icon ? `${props.theme.space[7]}px` : `0`}
  }
  display: flex;
  path {  
    fill: ${props => iconColorHandler(props)};
  }
  position: relative;
  .new-spinner {
    position: ${props => (props.isLoading ? "absolute" : "relative")};
    left: ${props => (props.isLoading && props.text ? "40%" : "unset")};
  }
`;

Button.defaultProps = {
  category: "primary",
  variant: "success",
  size: "small",
  isLoading: false,
  isDisabled: false,
};

const InvisibleText = styled.span`
  visibility: hidden;
`;

function Button(props: ButtonProps) {
  console.log("props", props);
  return (
    <StyledButton
      data-cy={props.cypressSelector}
      {...props}
      onClick={(e: React.MouseEvent<HTMLElement>) =>
        props.onClick && props.onClick(e)
      }
    >
      {props.icon && !props.isLoading ? (
        <Icon name={props.icon} size={props.size} />
      ) : props.isLoading && props.icon ? (
        <InvisibleText>
          <Icon name={props.icon} size={props.size} />
        </InvisibleText>
      ) : null}
      {props.text && !props.isLoading ? (
        props.text
      ) : props.isLoading ? (
        <InvisibleText>{props.text}</InvisibleText>
      ) : null}
      {props.isLoading ? <NewSpinner size={props.size} /> : null}
    </StyledButton>
  );
}

export default Button;
