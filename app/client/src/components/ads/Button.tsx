import React from "react";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import { IconName, Icon } from "./Icon";
import NewSpinner from "./NewSpinner";

export enum Category {
  primary = "primary",
  secondary = "secondary",
  tertiary = "tertiary",
}

export enum Variant {
  success = "success",
  info = "info",
  warning = "warning",
  danger = "danger",
}

export enum Size {
  small = "small",
  medium = "medium",
  large = "large",
}

type ButtonProps = CommonComponentProps & {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  text?: string;
  category?: Category; //default primary
  variant?: Variant; //default info
  icon?: IconName; //default undefined.
  size?: Size; // default medium
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

const stateStyles = (props: any, state: string) => {
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
        console.log("props.theme.colors", props.theme.colors);
        bgColorPrimary = props.theme.colors[props.variant].darkest;
        borderColorPrimary = props.theme.colors[props.variant].darkest;
        txtColorPrimary = props.theme.colors.blackShades[6];
        break;
      case "secondary":
        bgColorSecondary = props.theme.colors[props.variant].darkest;
        borderColorSecondary = props.theme.colors[props.variant].darker;
        txtColorSecondary = props.theme.colors.blackShades[6];
        break;
      default:
        bgColorTertiary = props.theme.colors.tertiary.darker;
        borderColorTertiary = props.theme.colors.tertiary.dark;
        txtColorTertiary = props.theme.colors.blackShades[6];
        break;
    }
  } else if (state === "main") {
    switch (props.category) {
      case "primary":
        bgColorPrimary = props.theme.colors[props.variant].main;
        txtColorPrimary = props.theme.colors.blackShades[9];
        borderColorPrimary = props.theme.colors[props.variant].main;
        break;
      case "secondary":
        bgColorSecondary = "transparent";
        borderColorSecondary = props.theme.colors[props.variant].main;
        txtColorSecondary = props.theme.colors[props.variant].main;
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
        bgColorPrimary = props.theme.colors[props.variant].dark;
        txtColorPrimary = props.theme.colors.blackShades[9];
        borderColorPrimary = props.theme.colors[props.variant].dark;
        break;
      case "secondary":
        bgColorSecondary = rgbaIntensity(
          props.theme.colors[props.variant].main,
        );
        txtColorSecondary = props.theme.colors[props.variant].main;
        borderColorSecondary = props.theme.colors[props.variant].main;
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
        bgColorPrimary = props.theme.colors[props.variant].dark;
        txtColorPrimary = props.theme.colors.blackShades[9];
        borderColorPrimary = props.theme.colors[props.variant].main;
        break;
      case "secondary":
        bgColorSecondary = rgbaIntensity(
          props.theme.colors[props.variant].main,
        );
        txtColorSecondary = props.theme.colors[props.variant].light;
        borderColorSecondary = props.theme.colors[props.variant].light;
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

const btnColorStyles = (props: any, state: string) => {
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

const btnFontStyles = (props: any) => {
  let fontSize, fontWeight, lineHeight, letterSpacing, padding;
  switch (props.size) {
    case "small":
      fontSize = `${props.theme.typography.btnSmall.fontSize}px`;
      fontWeight = props.theme.typography.btnSmall.fontWeight;
      lineHeight = `${props.theme.typography.btnSmall.lineHeight}px`;
      letterSpacing = `${props.theme.typography.btnSmall.letterSpacing}px`;
      padding =
        !props.text && props.icon
          ? `${props.theme.spaces[1]}px ${props.theme.spaces[1]}px`
          : `${props.theme.spaces[1]}px ${props.theme.spaces[6]}px ${props.theme
              .spaces[1] - 1}px`;
      break;
    case "medium":
      fontSize = `${props.theme.typography.btnMedium.fontSize}px`;
      fontWeight = props.theme.typography.btnMedium.fontWeight;
      lineHeight = `${props.theme.typography.btnMedium.lineHeight}px`;
      letterSpacing = `${props.theme.typography.btnMedium.letterSpacing}px`;
      padding =
        !props.text && props.icon
          ? `${props.theme.spaces[2]}px ${props.theme.spaces[2]}px`
          : `${props.theme.spaces[3] - 1}px ${props.theme.spaces[7]}px`;
      break;
    default:
      fontSize = `${props.theme.typography.btnLarge.fontSize}px`;
      fontWeight = props.theme.typography.btnLarge.fontWeight;
      lineHeight = `${props.theme.typography.btnLarge.lineHeight}px`;
      letterSpacing = `${props.theme.typography.btnLarge.letterSpacing}px`;
      padding =
        !props.text && props.icon
          ? `${props.theme.spaces[5] - 1}px ${props.theme.spaces[5] - 1}px`
          : `${props.theme.spaces[5] - 1}px ${props.theme.spaces[12] - 4}px`;
      break;
  }
  return { fontSize, fontWeight, lineHeight, letterSpacing, padding };
};

const iconColorHandler = (props: any) => {
  let iconColor: string;
  switch (props.category) {
    case "primary":
      iconColor = props.theme.colors.blackShades[9];
      break;
    case "secondary":
      iconColor = props.theme.colors[props.variant].main;
      break;
    default:
      iconColor = props.theme.colors.tertiary.light;
  }
  return iconColor;
};

const StyledButton = styled("button")`
  border: none;
  outline: none;
  text-transform: uppercase;;
  background-color: ${props => btnColorStyles(props, "main").bgColor};
  color: ${props => btnColorStyles(props, "main").txtColor};
  border: ${props => btnColorStyles(props, "main").borderColor};
  border-radius: ${props => props.theme.radii[0]};
  font-size: ${props => btnFontStyles(props).fontSize};
  font-weight: ${props => btnFontStyles(props).fontWeight};
  line-height: ${props => btnFontStyles(props).lineHeight};
  font-family: ${props => props.theme.fonts[3]};
  letter-spacing: ${props => btnFontStyles(props).letterSpacing};
  padding: ${props => btnFontStyles(props).padding};
  &:hover {
    background-color: ${props => btnColorStyles(props, "hover").bgColor}
    color: ${props => btnColorStyles(props, "hover").txtColor};
    border: ${props => btnColorStyles(props, "hover").borderColor};
    cursor: ${(props: any) =>
      props.isLoading || props.isDisabled ? `not-allowed` : `pointer`};
  };
  font-style: normal;
  &:active {
    background-color: ${props => btnColorStyles(props, "active").bgColor}
    color: ${props => btnColorStyles(props, "active").txtColor};
    border: ${props => btnColorStyles(props, "active").borderColor};
    cursor:  ${(props: any) =>
      props.isLoading || props.isDisabled ? `not-allowed` : `pointer`};
  };
  div {
    margin-right: ${(props: any) =>
      props.text && props.icon ? `${props.theme.spaces[4]}px` : `0`}
  }
  display: flex;
  path {  
    fill: ${props => iconColorHandler(props)};
  }
  position: relative;
  .new-spinner {
    position: ${(props: any) => (props.isLoading ? "absolute" : "relative")};
    left: ${(props: any) => (props.isLoading && props.text ? "40%" : "unset")};
  }
`;

Button.defaultProps = {
  category: "primary",
  variant: "success",
  size: "small",
  isLoading: false,
  isDisabled: false,
};

const InvisibleText = styled.div`
  visibility: hidden;
`;

function Button(props: ButtonProps) {
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
      ) : props.isLoading && props.icon && !props.text ? (
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
