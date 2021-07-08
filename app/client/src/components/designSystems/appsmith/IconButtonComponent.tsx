import * as React from "react";
import styled from "styled-components";
import { Button } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";

const IconButtonContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

export interface ButtonStyleProps {
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  buttonStyle?: ButtonStyle;
  buttonVariant?: ButtonVariant;
}

const StyledButton = styled(Button)<ButtonStyleProps>`
  background-image: none !important;

  ${({ buttonStyle, buttonVariant }) => `
    &:enabled {
      background-color: ${
        buttonStyle === ButtonStyleTypes.WARNING
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? "#FEB811"
            : "none"
          : buttonStyle === ButtonStyleTypes.DANGER
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? "#F22B2B"
            : "none"
          : buttonStyle === ButtonStyleTypes.INFO
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? "#6698FF"
            : "none"
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? "#858282"
            : "none"
          : buttonVariant === ButtonVariantTypes.SOLID
          ? "#03B365"
          : "none"
      } !important;
    }

    &:hover:enabled, &:active:enabled {
      background-color: ${
        buttonStyle === ButtonStyleTypes.WARNING
          ? buttonVariant === ButtonVariantTypes.OUTLINE
            ? "#FFFAE9"
            : buttonVariant === ButtonVariantTypes.GHOST
            ? "#FBEED0"
            : "#EFA903"
          : buttonStyle === ButtonStyleTypes.DANGER
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? "#B90707"
            : "#FDE4E4"
          : buttonStyle === ButtonStyleTypes.INFO
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? "#1A65FF"
            : "#CEDCFF"
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? buttonVariant === ButtonVariantTypes.OUTLINE
            ? "#F0F0F0"
            : buttonVariant === ButtonVariantTypes.GHOST
            ? "#E8E8E8"
            : "#4B4848"
          : buttonVariant === ButtonVariantTypes.OUTLINE
          ? "#D9FDED"
          : buttonVariant === ButtonVariantTypes.GHOST
          ? "#CBF4E2"
          : "#00693B"
      } !important;
    }

    &:disabled {
      background-color: #A9A7A7 !important;
      color: #FFFFFF !important;
    }

    border: ${
      buttonVariant === ButtonVariantTypes.OUTLINE
        ? buttonStyle === ButtonStyleTypes.WARNING
          ? "1px solid #FEB811"
          : buttonStyle === ButtonStyleTypes.DANGER
          ? "1px solid #F22B2B"
          : buttonStyle === ButtonStyleTypes.INFO
          ? "1px solid #6698FF"
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? "1px solid #858282"
          : "1px solid #03B365"
        : "none"
    } !important;

    & > span {
      color: ${
        buttonVariant === ButtonVariantTypes.SOLID
          ? "#FFFFFF"
          : buttonStyle === ButtonStyleTypes.WARNING
          ? "#FEB811"
          : buttonStyle === ButtonStyleTypes.DANGER
          ? "#F22B2B"
          : buttonStyle === ButtonStyleTypes.INFO
          ? "#6698FF"
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? "#858282"
          : "#03B365"
      } !important;
    }
  `}


  border-radius: ${({ borderRadius }) =>
    borderRadius === ButtonBorderRadiusTypes.CIRCLE
      ? "50%"
      : borderRadius === ButtonBorderRadiusTypes.ROUNDED
      ? "10px"
      : 0};

  box-shadow: ${({ boxShadow, boxShadowColor }) =>
    boxShadow === ButtonBoxShadowTypes.VARIANT1
      ? `0px 0px 4px 3px ${boxShadowColor || "rgba(0, 0, 0, 0.25)"}`
      : boxShadow === ButtonBoxShadowTypes.VARIANT2
      ? `3px 3px 4px ${boxShadowColor || "rgba(0, 0, 0, 0.25)"}`
      : boxShadow === ButtonBoxShadowTypes.VARIANT3
      ? `0px 1px 3px ${boxShadowColor || "rgba(0, 0, 0, 0.5)"}`
      : boxShadow === ButtonBoxShadowTypes.VARIANT4
      ? `2px 2px 0px ${boxShadowColor || "rgba(0, 0, 0, 0.25)"}`
      : boxShadow === ButtonBoxShadowTypes.VARIANT5
      ? `-2px -2px 0px ${boxShadowColor || "rgba(0, 0, 0, 0.25)"}`
      : "none"} !important;
`;

export enum ButtonStyleTypes {
  PRIMARY = "PRIMARY",
  WARNING = "WARNING",
  DANGER = "DANGER",
  INFO = "INFO",
  SECONDARY = "SECONDARY",
}
export type ButtonStyle = keyof typeof ButtonStyleTypes;

export enum ButtonVariantTypes {
  SOLID = "SOLID",
  OUTLINE = "OUTLINE",
  GHOST = "GHOST",
}
export type ButtonVariant = keyof typeof ButtonVariantTypes;

export enum ButtonBorderRadiusTypes {
  SHARP = "SHARP",
  ROUNDED = "ROUNDED",
  CIRCLE = "CIRCLE",
}
export type ButtonBorderRadius = keyof typeof ButtonBorderRadiusTypes;

export enum ButtonBoxShadowTypes {
  NONE = "NONE",
  VARIANT1 = "VARIANT1",
  VARIANT2 = "VARIANT2",
  VARIANT3 = "VARIANT3",
  VARIANT4 = "VARIANT4",
  VARIANT5 = "VARIANT5",
}
export type ButtonBoxShadow = keyof typeof ButtonBoxShadowTypes;

export interface IconButtonComponentProps extends ComponentProps {
  iconName?: IconName;
  buttonStyle: ButtonStyle;
  buttonVariant: ButtonVariant;
  borderRadius: ButtonBorderRadius;
  boxShadow: ButtonBoxShadow;
  boxShadowColor: string;
  isDisabled: boolean;
  isVisible: boolean;
  onClicked: () => void;
}

function IconButtonComponent(props: IconButtonComponentProps) {
  const {
    borderRadius,
    boxShadow,
    boxShadowColor,
    buttonStyle,
    buttonVariant,
    isDisabled,
    onClicked,
  } = props;

  return (
    <IconButtonContainer>
      <StyledButton
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        boxShadowColor={boxShadowColor}
        buttonStyle={buttonStyle}
        buttonVariant={buttonVariant}
        disabled={isDisabled}
        icon={props.iconName}
        large
        onClick={onClicked}
      />
    </IconButtonContainer>
  );
}

export default IconButtonComponent;
