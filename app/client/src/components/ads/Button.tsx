import React from "react";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import { IconName, Icon } from "./Icon";
import Spinner from "./Spinner";
import {
  mediumButton,
  smallButton,
  largeButton,
  Theme,
} from "../../constants/DefaultTheme";

export type ThemeProp = {
  theme: Theme;
};

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

type stateStyleType = {
  bgColorPrimary: string;
  borderColorPrimary: string;
  txtColorPrimary: string;
  bgColorSecondary: string;
  borderColorSecondary: string;
  txtColorSecondary: string;
  bgColorTertiary: string;
  borderColorTertiary: string;
  txtColorTertiary: string;
};

type BtnColorType = {
  bgColor: string;
  txtColor: string;
  border: string;
};

type BtnFontType = {
  buttonFont: any;
  padding: string;
};

type ButtonProps = CommonComponentProps & {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  text?: string;
  category?: Category;
  variant?: Variant;
  icon?: IconName;
  size?: Size;
};

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

const hexToRgba = (color: string, alpha: number) => {
  const value = hexToRgb(color);
  return `rgba(${value.r}, ${value.g}, ${value.b}, ${alpha});`;
};

const stateStyles = (
  props: ThemeProp & ButtonProps,
  state: string,
): stateStyleType => {
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
      case Category.primary:
        if (props.variant) {
          bgColorPrimary = props.theme.colors[props.variant].darkest;
          borderColorPrimary = props.theme.colors[props.variant].darkest;
        }
        txtColorPrimary = props.theme.colors.blackShades[6];
        break;
      case Category.secondary:
        if (props.variant) {
          bgColorSecondary = props.theme.colors[props.variant].darkest;
          borderColorSecondary = props.theme.colors[props.variant].darker;
        }
        txtColorSecondary = props.theme.colors.blackShades[6];
        break;
      case Category.tertiary:
        bgColorTertiary = props.theme.colors.tertiary.darker;
        borderColorTertiary = props.theme.colors.tertiary.dark;
        txtColorTertiary = props.theme.colors.blackShades[6];
        break;
    }
  } else if (state === "main") {
    switch (props.category) {
      case Category.primary:
        if (props.variant) {
          bgColorPrimary = props.theme.colors[props.variant].main;
          borderColorPrimary = props.theme.colors[props.variant].main;
        }
        txtColorPrimary = props.theme.colors.blackShades[9];
        break;
      case Category.secondary:
        if (props.variant) {
          borderColorSecondary = props.theme.colors[props.variant].main;
          txtColorSecondary = props.theme.colors[props.variant].main;
        }
        bgColorSecondary = "transparent";
        break;
      case Category.tertiary:
        bgColorTertiary = "transparent";
        borderColorTertiary = props.theme.colors.tertiary.main;
        txtColorTertiary = props.theme.colors.tertiary.main;
        break;
    }
  } else if (state === "hover") {
    switch (props.category) {
      case Category.primary:
        if (props.variant) {
          bgColorPrimary = props.theme.colors[props.variant].dark;
          borderColorPrimary = props.theme.colors[props.variant].dark;
        }
        txtColorPrimary = props.theme.colors.blackShades[9];
        break;
      case Category.secondary:
        if (props.variant) {
          bgColorSecondary = hexToRgba(
            props.theme.colors[props.variant].main,
            0.1,
          );
          txtColorSecondary = props.theme.colors[props.variant].main;
          borderColorSecondary = props.theme.colors[props.variant].main;
        }
        break;
      case Category.tertiary:
        bgColorTertiary = hexToRgba(props.theme.colors.tertiary.main, 0.1);
        borderColorTertiary = props.theme.colors.tertiary.main;
        txtColorTertiary = props.theme.colors.tertiary.main;
        break;
    }
  } else if (state === "active") {
    switch (props.category) {
      case Category.primary:
        if (props.variant) {
          bgColorPrimary = props.theme.colors[props.variant].dark;
          borderColorPrimary = props.theme.colors[props.variant].main;
        }
        txtColorPrimary = props.theme.colors.blackShades[9];
        break;
      case Category.secondary:
        if (props.variant) {
          bgColorSecondary = hexToRgba(
            props.theme.colors[props.variant].main,
            0.1,
          );
          txtColorSecondary = props.theme.colors[props.variant].light;
          borderColorSecondary = props.theme.colors[props.variant].light;
        }
        break;
      case Category.tertiary:
        bgColorTertiary = hexToRgba(props.theme.colors.tertiary.main, 0.1);
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
  props: ThemeProp & ButtonProps,
  state: string,
): BtnColorType => {
  let bgColor = "",
    txtColor = "",
    border = "";
  switch (props.category) {
    case Category.primary:
      bgColor = stateStyles(props, state).bgColorPrimary;
      txtColor = stateStyles(props, state).txtColorPrimary;
      border = `2px solid ${stateStyles(props, state).borderColorPrimary}`;
      break;
    case Category.secondary:
      bgColor = stateStyles(props, state).bgColorSecondary;
      txtColor = stateStyles(props, state).txtColorSecondary;
      border = `2px solid ${stateStyles(props, state).borderColorSecondary}`;
      break;
    case Category.tertiary:
      bgColor = stateStyles(props, state).bgColorTertiary;
      txtColor = stateStyles(props, state).txtColorTertiary;
      border = `2px solid ${stateStyles(props, state).borderColorTertiary}`;
      break;
  }
  return { bgColor, txtColor, border };
};

const btnFontStyles = (props: ThemeProp & ButtonProps): BtnFontType => {
  let buttonFont,
    padding = "";
  switch (props.size) {
    case Size.small:
      buttonFont = smallButton;
      padding =
        !props.text && props.icon
          ? `${props.theme.spaces[1]}px ${props.theme.spaces[1]}px`
          : `${props.theme.spaces[1]}px ${props.theme.spaces[6]}px ${props.theme
              .spaces[1] - 1}px`;
      break;
    case Size.medium:
      buttonFont = mediumButton;
      padding =
        !props.text && props.icon
          ? `${props.theme.spaces[2]}px ${props.theme.spaces[2]}px`
          : `${props.theme.spaces[3] - 1}px ${props.theme.spaces[7]}px`;
      break;
    case Size.large:
      buttonFont = largeButton;
      padding =
        !props.text && props.icon
          ? `${props.theme.spaces[5] - 1}px ${props.theme.spaces[5] - 1}px`
          : `${props.theme.spaces[5] - 1}px ${props.theme.spaces[12] - 4}px`;
      break;
  }
  return { buttonFont, padding };
};

const StyledButton = styled("button")<ThemeProp & ButtonProps>`
  border: none;
  outline: none;
  text-transform: uppercase;
  background-color: ${props => btnColorStyles(props, "main").bgColor};
  color: ${props => btnColorStyles(props, "main").txtColor};
  border: ${props => btnColorStyles(props, "main").border};
  border-radius: ${props => props.theme.radii[0]};
  font-family: ${props => props.theme.fonts[3]};
  ${props => btnFontStyles(props).buttonFont};
  padding: ${props => btnFontStyles(props).padding};
  .ads-icon {
    margin-right: ${props =>
        props.text && props.icon ? `${props.theme.spaces[4]}px` : `0`}
      path {
      fill: ${props => btnColorStyles(props, "main").txtColor};
    }
  }
  &:hover {
    background-color: ${props => btnColorStyles(props, "hover").bgColor};
    color: ${props => btnColorStyles(props, "hover").txtColor};
    border: ${props => btnColorStyles(props, "hover").border};
    cursor: ${props =>
      props.isLoading || props.isDisabled ? `not-allowed` : `pointer`};
    .ads-icon {
      margin-right: ${props =>
          props.text && props.icon ? `${props.theme.spaces[4]}px` : `0`}
        path {
        fill: ${props => btnColorStyles(props, "hover").txtColor};
      }
    }
  }
  font-style: normal;
  &:active {
    background-color: ${props => btnColorStyles(props, "active").bgColor};
    color: ${props => btnColorStyles(props, "active").txtColor};
    border: ${props => btnColorStyles(props, "active").border};
    cursor: ${props =>
      props.isLoading || props.isDisabled ? `not-allowed` : `pointer`};
    .ads-icon {
      path {
        fill: ${props => btnColorStyles(props, "active").txtColor};
      }
    }
  }
  display: flex;
  position: relative;
  .new-spinner {
    position: absolute;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
  }
`;

Button.defaultProps = {
  category: Category.primary,
  variant: Variant.success,
  size: Size.small,
  isLoading: false,
  isDisabled: false,
};

export const VisibilityWrapper = styled.div`
  visibility: hidden;
`;

function Button(props: ButtonProps) {
  const IconLoadingState = (
    <Icon name={props.icon} size={props.size} invisible={true} />
  );

  const TextLoadingState = <VisibilityWrapper>{props.text}</VisibilityWrapper>;

  return (
    <StyledButton
      data-cy={props.cypressSelector}
      {...props}
      onClick={(e: React.MouseEvent<HTMLElement>) =>
        props.onClick && props.onClick(e)
      }
    >
      {props.icon ? (
        props.isLoading ? (
          IconLoadingState
        ) : (
          <Icon name={props.icon} size={props.size} />
        )
      ) : null}

      {props.text ? (props.isLoading ? TextLoadingState : props.text) : null}

      {props.isLoading ? <Spinner size={props.size} /> : null}
    </StyledButton>
  );
}

export default Button;
