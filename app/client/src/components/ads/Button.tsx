import React from "react";
import { CommonComponentProps, hexToRgba, ThemeProp, Classes } from "./common";
import styled from "styled-components";
import Icon, { IconName, IconSize } from "./Icon";
import Spinner from "./Spinner";
import { mediumButton, smallButton, largeButton } from "constants/DefaultTheme";

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
  height: number;
};

type ButtonProps = CommonComponentProps & {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  text?: string;
  category?: Category;
  variant?: Variant;
  className?: string;
  icon?: IconName;
  size?: Size;
  fill?: boolean;
  href?: string;
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

  if (props.isLoading || props.disabled) {
    switch (props.category) {
      case Category.primary:
        if (props.variant) {
          bgColorPrimary = props.theme.colors[props.variant].darkest;
          borderColorPrimary = props.theme.colors[props.variant].darkest;
        }
        txtColorPrimary = props.theme.colors.button.disabledText;
        break;
      case Category.secondary:
        if (props.variant) {
          bgColorSecondary = props.theme.colors[props.variant].darkest;
          borderColorSecondary = props.theme.colors[props.variant].darker;
        }
        txtColorSecondary = props.theme.colors.button.disabledText;
        break;
      case Category.tertiary:
        bgColorTertiary = props.theme.colors.tertiary.darker;
        borderColorTertiary = props.theme.colors.tertiary.dark;
        txtColorTertiary = props.theme.colors.button.disabledText;
        break;
    }
  } else if (state === "main") {
    switch (props.category) {
      case Category.primary:
        if (props.variant) {
          bgColorPrimary = props.theme.colors[props.variant].main;
          borderColorPrimary = props.theme.colors[props.variant].main;
        }
        txtColorPrimary = "#fff";
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
        txtColorPrimary = "#fff";
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
        txtColorPrimary = "#fff";
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
    padding = "",
    height = 0;
  switch (props.size) {
    case Size.small:
      buttonFont = smallButton;
      height = 20;
      padding =
        !props.text && props.icon
          ? `0px ${props.theme.spaces[1]}px`
          : `0px ${props.theme.spaces[3]}px`;
      break;
    case Size.medium:
      buttonFont = mediumButton;
      height = 30;
      padding =
        !props.text && props.icon
          ? `0px ${props.theme.spaces[2]}px`
          : `0px ${props.theme.spaces[7]}px`;
      break;
    case Size.large:
      buttonFont = largeButton;
      height = 38;
      padding =
        !props.text && props.icon
          ? `0px ${props.theme.spaces[3]}px`
          : `0px ${props.theme.spaces[12] - 4}px`;
      break;
  }
  return { buttonFont, padding, height };
};

const StyledButton = styled("a")<ThemeProp & ButtonProps>`
  width: ${props => (props.fill ? "100%" : "auto")};
  height: ${props => btnFontStyles(props).height}px;
  border: none;
  text-decoration: none;
  outline: none;
  text-transform: uppercase;
  background-color: ${props => btnColorStyles(props, "main").bgColor};
  color: ${props => btnColorStyles(props, "main").txtColor};
  border: ${props => btnColorStyles(props, "main").border};
  border-radius: ${props => props.theme.radii[0]};
  ${props => btnFontStyles(props).buttonFont};
  padding: ${props => btnFontStyles(props).padding};
  .${Classes.ICON} {
    margin-right: ${props =>
      props.text && props.icon ? `${props.theme.spaces[2] - 1}px` : `0`};
    path {
      fill: ${props => btnColorStyles(props, "main").txtColor};
    }
  }
  &:hover {
    text-decoration: none;
    background-color: ${props => btnColorStyles(props, "hover").bgColor};
    color: ${props => btnColorStyles(props, "hover").txtColor};
    border: ${props => btnColorStyles(props, "hover").border};
    cursor: ${props =>
      props.isLoading || props.disabled ? `not-allowed` : `pointer`};
    .${Classes.ICON} {
      margin-right: ${props =>
        props.text && props.icon ? `${props.theme.spaces[2] - 1}px` : `0`};
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
      props.isLoading || props.disabled ? `not-allowed` : `pointer`};
    .${Classes.ICON} {
      path {
        fill: ${props => btnColorStyles(props, "active").txtColor};
      }
    }
  }
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  .new-spinner {
    position: absolute;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
  }
`;

export const VisibilityWrapper = styled.div`
  visibility: hidden;
`;

const IconSizeProp = (size?: Size) => {
  if (size === Size.small) {
    return IconSize.SMALL;
  } else if (size === Size.medium) {
    return IconSize.MEDIUM;
  } else if (size === Size.large) {
    return IconSize.LARGE;
  } else {
    return IconSize.SMALL;
  }
};

Button.defaultProps = {
  category: Category.primary,
  variant: Variant.info,
  size: Size.small,
  isLoading: false,
  disabled: false,
  fill: false,
};

function Button(props: ButtonProps) {
  const IconLoadingState = (
    <Icon name={props.icon} size={IconSizeProp(props.size)} invisible={true} />
  );

  const TextLoadingState = <VisibilityWrapper>{props.text}</VisibilityWrapper>;

  return (
    <StyledButton
      href={props.href}
      className={props.className}
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
          <Icon name={props.icon} size={IconSizeProp(props.size)} />
        )
      ) : null}

      {props.text ? (props.isLoading ? TextLoadingState : props.text) : null}

      {props.isLoading ? <Spinner size={IconSizeProp(props.size)} /> : null}
    </StyledButton>
  );
}

export default Button;
