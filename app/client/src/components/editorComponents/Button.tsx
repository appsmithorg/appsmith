import React from "react";
import {
  Intent,
  BlueprintButtonIntentsCSS,
  Skin,
} from "constants/DefaultTheme";
import styled, { css } from "styled-components";
import {
  AnchorButton as BlueprintAnchorButton,
  Button as BlueprintButton,
  Intent as BlueprintIntent,
  IconName,
  MaybeElement,
} from "@blueprintjs/core";
import { Direction, Directions } from "utils/helpers";

const outline = css`
  &&&&&& {
    border-width: 1px;
    border-style: solid;
  }
`;

const buttonStyles = css<{
  outline?: string;
  intent?: Intent;
  filled?: string;
  fluid?: boolean;
  skin?: Skin;
  iconAlignment?: Direction;
}>`
  ${BlueprintButtonIntentsCSS}
  &&&& {
    padding: ${props =>
      props.filled || props.outline
        ? props.theme.spaces[2] + "px " + props.theme.spaces[3] + "px"
        : 0};

    background: ${props =>
      props.filled || props.outline ? "inherit" : "transparent"};

    width: ${props => (props.fluid ? "100%" : "auto")};
  }
  &&&&&& {
    &.bp3-button span {
      font-weight: ${props => (props.skin !== undefined ? 400 : 700)};
    }
    .bp3-icon svg {
      width: ${props => (props.skin !== undefined ? 14 : 16)}px;
      height: ${props => (props.skin !== undefined ? 14 : 16)}px;
    }
    &.bp3-button {
      display: flex;
      justify-content: ${props =>
        props.skin === undefined
          ? "center"
          : props.iconAlignment === Directions.RIGHT
          ? "space-between"
          : "flex-start"};
    }
  }
  ${props => (props.outline ? outline : "")}
`;
const StyledButton = styled(BlueprintButton)<{
  outline?: string;
  intent?: Intent;
  filled?: string;
  skin?: Skin;
  iconAlignment?: Direction;
}>`
  ${buttonStyles}
`;
const StyledAnchorButton = styled(BlueprintAnchorButton)<{
  outline?: string;
  intent?: Intent;
  filled?: string;
  skin?: Skin;
  iconAlignment?: Direction;
}>`
  ${buttonStyles}
`;

export type ButtonProps = {
  outline?: boolean;
  filled?: boolean;
  intent?: Intent;
  text?: string;
  onClick?: () => void;
  href?: string;
  icon?: string | MaybeElement;
  iconAlignment?: Direction;
  loading?: boolean;
  disabled?: boolean;
  size?: "large" | "small";
  type?: "button" | "submit" | "reset";
  className?: string;
  fluid?: boolean;
  skin?: Skin;
};

export const Button = (props: ButtonProps) => {
  const icon: IconName | undefined =
    props.icon &&
    (props.iconAlignment === Directions.LEFT ||
      props.iconAlignment === undefined)
      ? (props.icon as IconName)
      : undefined;
  const rightIcon: IconName | undefined =
    props.icon && props.iconAlignment === Directions.RIGHT
      ? (props.icon as IconName)
      : undefined;

  const baseProps = {
    text: props.text,
    minimal: !props.filled,
    outline: props.outline ? props.outline.toString() : undefined,
    filled: props.filled ? props.filled.toString() : undefined,
    intent: props.intent as BlueprintIntent,
    large: props.size === "large",
    small: props.size === "small",
    loading: props.loading,
    disabled: props.disabled,
    type: props.type,
    className: props.className,
    fluid: props.fluid ? props.fluid.toString() : undefined,
    skin: props.skin,
    iconAlignment: props.iconAlignment ? props.iconAlignment : undefined,
  };
  if (props.href) {
    return (
      <StyledAnchorButton
        icon={icon}
        rightIcon={rightIcon}
        {...baseProps}
        href={props.href}
      />
    );
  } else
    return (
      <StyledButton
        rightIcon={rightIcon}
        icon={icon}
        {...baseProps}
        onClick={props.onClick}
      />
    );
};

export default Button;
