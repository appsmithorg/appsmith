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
  IButtonProps,
} from "@blueprintjs/core";
import { Direction, Directions } from "utils/helpers";
import { omit } from "lodash";

const outline = css`
  &&&&&& {
    border-width: 1px;
    border-style: solid;
  }
`;

const buttonStyles = css<Partial<ButtonProps>>`
  ${BlueprintButtonIntentsCSS}
  &&&& {
    border-radius: 0;
    background: ${(props) =>
      props.filled || props.outline ? "inherit" : "transparent"};

    width: ${(props) => (props.fluid ? "100%" : "auto")};
  }
  &&&&&& {
    &.bp3-button span {
      font-weight: ${(props) => (props.skin !== undefined ? 400 : 700)};
    }
    .bp3-icon svg {
      width: ${(props) => (props.skin !== undefined ? 14 : 16)}px;
      height: ${(props) => (props.skin !== undefined ? 14 : 16)}px;
    }
    &.bp3-button {
      display: flex;
      justify-content: ${(props) =>
        props.skin === undefined
          ? "center"
          : props.iconAlignment === Directions.RIGHT
          ? "space-between"
          : "flex-start"};
    }
  }
  ${(props) => (props.outline ? outline : "")}
`;
const StyledButton = styled((props: IButtonProps & Partial<ButtonProps>) => (
  <BlueprintButton
    {...omit(props, ["iconAlignment", "fluid", "filled", "outline"])}
  />
))`
  ${buttonStyles}
`;
const StyledAnchorButton = styled(
  (props: IButtonProps & Partial<ButtonProps>) => (
    <BlueprintAnchorButton
      {...omit(props, ["iconAlignment", "fluid", "filled", "outline"])}
    />
  ),
)`
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
  target?: string;
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
    outline: !!props.outline,
    filled: !!props.filled,
    intent: props.intent as BlueprintIntent,
    large: props.size === "large",
    small: props.size === "small",
    loading: props.loading,
    disabled: props.disabled,
    type: props.type,
    className: props.className,
    fluid: !!props.fluid,
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
        target={props.target}
      />
    );
  } else
    return (
      <StyledButton
        icon={icon}
        rightIcon={rightIcon}
        {...baseProps}
        onClick={props.onClick}
      />
    );
};

export default Button;
