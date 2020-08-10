import React from "react";
import {
  IButtonProps,
  MaybeElement,
  Button,
  IconName,
} from "@blueprintjs/core";
import styled, { css } from "styled-components";
import { ButtonStyle } from "widgets/ButtonWidget";
import { Theme, darkenHover, darkenActive } from "constants/DefaultTheme";
import _ from "lodash";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";

const getButtonColorStyles = (props: { theme: Theme } & ButtonStyleProps) => {
  if (props.filled) return props.theme.colors.textOnDarkBG;
  if (props.accent) {
    if (props.accent === "secondary") {
      return props.theme.colors.OXFORD_BLUE;
    }
    return props.theme.colors[AccentColorMap[props.accent]];
  }
};

const ButtonColorStyles = css<ButtonStyleProps>`
  color: ${getButtonColorStyles};
  svg {
    fill: ${getButtonColorStyles};
  }
`;
const AccentColorMap: Record<ButtonStyleName, string> = {
  primary: "primaryOld",
  secondary: "secondaryOld",
  error: "error",
};

const ButtonWrapper = styled((props: ButtonStyleProps & IButtonProps) => (
  <Button {..._.omit(props, ["accent", "filled"])} />
))<ButtonStyleProps>`
  &&&& {
    ${ButtonColorStyles};
    width: 100%;
    height: 100%;
    transition: background-color 0.2s;
    background-color: ${props =>
      props.filled &&
      props.accent &&
      props.theme.colors[AccentColorMap[props.accent]]};
    border: 1px solid
      ${props =>
        props.accent
          ? props.theme.colors[AccentColorMap[props.accent]]
          : props.theme.colors.secondary};
    border-radius: 4px;
    font-weight: ${props => props.theme.fontWeights[2]};
    outline: none;
    &.bp3-button {
      padding: 0px 10px;
    }
    && .bp3-button-text {
      max-width: 99%;
      max-height: 100%;
      overflow: hidden;
    }
    &&:hover,
    &&:focus {
      ${ButtonColorStyles};
      background-color: ${props => {
        if (!props.filled) return props.theme.colors.secondaryDarker;
        if (props.accent !== "secondary" && props.accent) {
          return darkenHover(props.theme.colors[AccentColorMap[props.accent]]);
        }
      }};
      border-color: ${props => {
        if (!props.filled) return;
        if (props.accent !== "secondary" && props.accent) {
          return darkenHover(props.theme.colors[AccentColorMap[props.accent]]);
        }
      }};
    }
    &&:active {
      ${ButtonColorStyles};
      background-color: ${props => {
        if (!props.filled) return props.theme.colors.secondaryDarkest;
        if (props.accent !== "secondary" && props.accent) {
          return darkenActive(props.theme.colors[AccentColorMap[props.accent]]);
        }
      }};
      border-color: ${props => {
        if (!props.filled) return;
        if (props.accent !== "secondary" && props.accent) {
          return darkenActive(props.theme.colors[AccentColorMap[props.accent]]);
        }
      }};
    }
    &&.bp3-disabled {
      background-color: #d0d7dd;
      border: none;
    }
  }
`;

export type ButtonStyleName = "primary" | "secondary" | "error";

type ButtonStyleProps = {
  accent?: ButtonStyleName;
  filled?: boolean;
};

// To be used in any other part of the app
export const BaseButton = (props: IButtonProps & ButtonStyleProps) => {
  return <ButtonWrapper {...props} />;
};

BaseButton.defaultProps = {
  accent: "secondary",
  disabled: false,
  text: "Button Text",
  minimal: true,
};

export enum ButtonType {
  SUBMIT = "submit",
  RESET = "reset",
  BUTTON = "button",
}

interface ButtonContainerProps extends ComponentProps {
  text?: string;
  icon?: MaybeElement;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  buttonStyle?: ButtonStyle;
  isLoading: boolean;
  rightIcon?: IconName | MaybeElement;
  type: ButtonType;
}

const mapButtonStyleToStyleName = (buttonStyle?: ButtonStyle) => {
  switch (buttonStyle) {
    case "PRIMARY_BUTTON":
      return "primary";
    case "SECONDARY_BUTTON":
      return "secondary";
    case "DANGER_BUTTON":
      return "error";
    default:
      return undefined;
  }
};

// To be used with the canvas
const ButtonContainer = (props: ButtonContainerProps & ButtonStyleProps) => {
  return (
    <BaseButton
      loading={props.isLoading}
      icon={props.icon}
      rightIcon={props.rightIcon}
      text={props.text}
      filled={props.buttonStyle !== "SECONDARY_BUTTON"}
      accent={mapButtonStyleToStyleName(props.buttonStyle)}
      onClick={props.onClick}
      disabled={props.disabled}
      type={props.type}
    />
  );
};

export default ButtonContainer;
