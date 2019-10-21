import React from "react";
import { Button, IButtonProps, MaybeElement } from "@blueprintjs/core";
import styled, { css } from "styled-components";
import { Container } from "../../editorComponents/ContainerComponent";
import { TextComponentProps } from "./TextViewComponent";

const ButtonColorStyles = css<ButtonStyleProps>`
  color: ${props => {
    if (props.filled) return props.theme.colors.textOnDarkBG;
    if (props.styleName) {
      if (props.styleName === "secondary")
        return props.theme.colors.OXFORD_BLUE;
      return props.theme.colors[props.styleName];
    }
  }};
`;

const ButtonWrapper = styled(Button)<ButtonStyleProps>`
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
    font-weight: bold;
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
  }
`;

type ButtonStyleProps = {
  styleName?: "primary" | "secondary" | "error";
  filled?: boolean;
};

// To be used in any other part of the app
export const BaseButton = (props: IButtonProps & ButtonStyleProps) => {
  return <ButtonWrapper {...props} />;
};

BaseButton.defaultProps = {
  styleName: "secondary",
  text: "Button Text",
  minimal: true,
};

interface ButtonContainerProps extends TextComponentProps {
  icon?: MaybeElement;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

// To be used with the canvas
const ButtonContainer = (props: ButtonContainerProps) => {
  return (
    <Container {...props}>
      <BaseButton icon={props.icon} text={props.text} onClick={props.onClick} />
    </Container>
  );
};

export default ButtonContainer;
