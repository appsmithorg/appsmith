import React from "react";
import { AnchorButton, IButtonProps, MaybeElement } from "@blueprintjs/core";
import styled, { css } from "styled-components";
import { TextComponentProps } from "./TextComponent";
import { ButtonStyle } from "widgets/ButtonWidget";
import { Theme } from "constants/DefaultTheme";

const getButtonColorStyles = (props: { theme: Theme } & ButtonStyleProps) => {
  if (props.filled) return props.theme.colors.textOnDarkBG;
  if (props.styleName) {
    if (props.styleName === "secondary") {
      return props.theme.colors.OXFORD_BLUE;
    }
    return props.theme.colors[props.styleName];
  }
};

const ButtonColorStyles = css<ButtonStyleProps>`
  color: ${getButtonColorStyles};
  svg {
    fill: ${getButtonColorStyles};
  }
`;

const ButtonWrapper = styled(AnchorButton)<ButtonStyleProps>`
  && {
    ${ButtonColorStyles};
    width: 100%;
    height: 100%;
    transition: background-color 0.2s;
    background-color: ${props =>
      props.filled && props.styleName && props.theme.colors[props.styleName]};
    border: 1px solid
      ${props =>
        props.styleName
          ? props.theme.colors[props.styleName]
          : props.theme.colors.secondary};
    border-radius: 4px;
    font-weight: ${props => props.theme.fontWeights[2]};
    font-family: "DM Sans";
    outline: none;
    &&:hover,
    &&:focus {
      ${ButtonColorStyles};
      background-color: ${props => {
        if (!props.filled) return props.theme.colors.secondaryDarker;
        if (props.styleName !== "secondary") {
          return props.theme.colors[`${props.styleName}Darker`];
        }
      }};
      border-color: ${props => {
        if (!props.filled) return;
        if (props.styleName !== "secondary") {
          return props.theme.colors[`${props.styleName}Darker`];
        }
      }};
    }
    &&:active {
      ${ButtonColorStyles};
      background-color: ${props => {
        if (!props.filled) return props.theme.colors.secondaryDarkest;
        if (props.styleName !== "secondary") {
          return props.theme.colors[`${props.styleName}Darkest`];
        }
      }};
      border-color: ${props => {
        if (!props.filled) return;
        if (props.styleName !== "secondary") {
          return props.theme.colors[`${props.styleName}Darkest`];
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
  styleName?: ButtonStyleName;
  filled?: boolean;
};

// To be used in any other part of the app
export const BaseButton = (props: IButtonProps & ButtonStyleProps) => {
  return <ButtonWrapper {...props} />;
};

BaseButton.defaultProps = {
  styleName: "secondary",
  disabled: false,
  text: "Button Text",
  minimal: true,
};

interface ButtonContainerProps extends TextComponentProps {
  icon?: MaybeElement;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  buttonStyle?: ButtonStyle;
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
      icon={props.icon}
      text={props.text}
      filled={props.buttonStyle === "PRIMARY_BUTTON"}
      styleName={mapButtonStyleToStyleName(props.buttonStyle)}
      onClick={props.onClick}
      disabled={props.disabled}
    />
  );
};

export default ButtonContainer;
