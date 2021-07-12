import * as React from "react";
import styled from "styled-components";
import { Button } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { ThemeProp } from "components/ads/common";

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

const StyledButton = styled(Button)<ThemeProp & ButtonStyleProps>`
  background-image: none !important;

  ${({ buttonStyle, buttonVariant, theme }) => `
    &:enabled {
      background: ${
        buttonStyle === ButtonStyleTypes.WARNING
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? theme.colors.button.warning.solid.bgColor
            : "none"
          : buttonStyle === ButtonStyleTypes.DANGER
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? theme.colors.button.danger.solid.bgColor
            : "none"
          : buttonStyle === ButtonStyleTypes.INFO
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? theme.colors.button.info.solid.bgColor
            : "none"
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? theme.colors.button.secondary.solid.bgColor
            : "none"
          : buttonVariant === ButtonVariantTypes.SOLID
          ? theme.colors.button.primary.solid.bgColor
          : "none"
      } !important;
    }

    &:hover:enabled, &:active:enabled {
      background: ${
        buttonStyle === ButtonStyleTypes.WARNING
          ? buttonVariant === ButtonVariantTypes.OUTLINE
            ? theme.colors.button.warning.outline.hoverColor
            : buttonVariant === ButtonVariantTypes.GHOST
            ? theme.colors.button.warning.ghost.hoverColor
            : theme.colors.button.warning.solid.hoverColor
          : buttonStyle === ButtonStyleTypes.DANGER
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? theme.colors.button.danger.solid.hoverColor
            : theme.colors.button.danger.outline.hoverColor
          : buttonStyle === ButtonStyleTypes.INFO
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? theme.colors.button.info.solid.hoverColor
            : theme.colors.button.info.outline.hoverColor
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? buttonVariant === ButtonVariantTypes.OUTLINE
            ? theme.colors.button.secondary.outline.hoverColor
            : buttonVariant === ButtonVariantTypes.GHOST
            ? theme.colors.button.secondary.ghost.hoverColor
            : theme.colors.button.secondary.solid.hoverColor
          : buttonVariant === ButtonVariantTypes.OUTLINE
          ? theme.colors.button.primary.outline.hoverColor
          : buttonVariant === ButtonVariantTypes.GHOST
          ? theme.colors.button.primary.ghost.hoverColor
          : theme.colors.button.primary.solid.hoverColor
      } !important;
    }

    &:disabled {
      background-color: ${theme.colors.button.disabled.bgColor} !important;
      color: ${theme.colors.button.disabled.textColor} !important;
    }

    border: ${
      buttonVariant === ButtonVariantTypes.OUTLINE
        ? buttonStyle === ButtonStyleTypes.WARNING
          ? `1px solid ${theme.colors.button.warning.outline.borderColor}`
          : buttonStyle === ButtonStyleTypes.DANGER
          ? `1px solid ${theme.colors.button.danger.outline.borderColor}`
          : buttonStyle === ButtonStyleTypes.INFO
          ? `1px solid ${theme.colors.button.info.outline.borderColor}`
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? `1px solid ${theme.colors.button.secondary.outline.borderColor}`
          : `1px solid ${theme.colors.button.primary.outline.borderColor}`
        : "none"
    } !important;

    & > span {
      color: ${
        buttonVariant === ButtonVariantTypes.SOLID
          ? `${theme.colors.button.primary.solid.textColor}`
          : buttonStyle === ButtonStyleTypes.WARNING
          ? `${theme.colors.button.warning.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.DANGER
          ? `${theme.colors.button.danger.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.INFO
          ? `${theme.colors.button.info.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? `${theme.colors.button.secondary.outline.textColor}`
          : `${theme.colors.button.primary.outline.textColor}`
      } !important;
    }
  `}


  border-radius: ${({ borderRadius }) =>
    borderRadius === ButtonBorderRadiusTypes.CIRCLE
      ? "50%"
      : borderRadius === ButtonBorderRadiusTypes.ROUNDED
      ? "10px"
      : 0};

  box-shadow: ${({ boxShadow, boxShadowColor, theme }) =>
    boxShadow === ButtonBoxShadowTypes.VARIANT1
      ? `0px 0px 4px 3px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant1}`
      : boxShadow === ButtonBoxShadowTypes.VARIANT2
      ? `3px 3px 4px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant2}`
      : boxShadow === ButtonBoxShadowTypes.VARIANT3
      ? `0px 1px 3px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant3}`
      : boxShadow === ButtonBoxShadowTypes.VARIANT4
      ? `2px 2px 0px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant4}`
      : boxShadow === ButtonBoxShadowTypes.VARIANT5
      ? `-2px -2px 0px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant5}`
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
  onClick: () => void;
}

function IconButtonComponent(props: IconButtonComponentProps) {
  const {
    borderRadius,
    boxShadow,
    boxShadowColor,
    buttonStyle,
    buttonVariant,
    isDisabled,
    onClick,
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
        onClick={onClick}
      />
    </IconButtonContainer>
  );
}

export default IconButtonComponent;
