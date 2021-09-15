import React from "react";
import styled from "styled-components";
import tinycolor from "tinycolor2";

import { IButtonProps, Button, Alignment } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";

import { Theme } from "constants/DefaultTheme";

import { ThemeProp } from "components/ads/common";

import _ from "lodash";
import {
  ButtonStyleTypes,
  ButtonBoxShadow,
  ButtonBoxShadowTypes,
  ButtonBorderRadius,
  ButtonBorderRadiusTypes,
  ButtonStyleType,
  ButtonVariant,
  ButtonVariantTypes,
} from "components/constants";

const getCustomTextColor = (
  theme: Theme,
  backgroundColor?: string,
  prevButtonStyle?: ButtonStyleType,
) => {
  if (!backgroundColor)
    return theme.colors.button[
      (prevButtonStyle || ButtonStyleTypes.PRIMARY).toLowerCase()
    ].solid.textColor;
  const isDark = tinycolor(backgroundColor).isDark();
  if (isDark) {
    return theme.colors.button.custom.solid.light.textColor;
  }
  return theme.colors.button.custom.solid.dark.textColor;
};

const getCustomHoverColor = (
  theme: Theme,
  prevButtonStyle?: ButtonStyleType,
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  if (!backgroundColor) {
    return theme.colors.button[
      (prevButtonStyle || ButtonStyleTypes.PRIMARY).toLowerCase()
    ][(buttonVariant || ButtonVariantTypes.SOLID).toLowerCase()].hoverColor;
  }

  switch (buttonVariant) {
    case ButtonVariantTypes.OUTLINE:
      return backgroundColor
        ? tinycolor(backgroundColor)
            .lighten(40)
            .toString()
        : theme.colors.button.primary.outline.hoverColor;

    case ButtonVariantTypes.GHOST:
      return backgroundColor
        ? tinycolor(backgroundColor)
            .lighten(40)
            .toString()
        : theme.colors.button.primary.ghost.hoverColor;

    default:
      return backgroundColor
        ? tinycolor(backgroundColor)
            .darken(10)
            .toString()
        : theme.colors.button.primary.solid.hoverColor;
  }
};

const getCustomBackgroundColor = (
  theme: Theme,
  prevButtonStyle?: ButtonStyleType,
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  return buttonVariant === ButtonVariantTypes.SOLID
    ? backgroundColor
      ? backgroundColor
      : theme.colors.button[
          (prevButtonStyle || ButtonStyleTypes.PRIMARY).toLowerCase()
        ].solid.bgColor
    : "none";
};

const getCustomBorderColor = (
  theme: Theme,
  prevButtonStyle?: ButtonStyleType,
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  return buttonVariant === ButtonVariantTypes.OUTLINE
    ? backgroundColor
      ? backgroundColor
      : theme.colors.button[
          (prevButtonStyle || ButtonStyleTypes.PRIMARY).toLowerCase()
        ].outline.borderColor
    : "none";
};

export const StyledButton = styled((props) => (
  <Button
    {..._.omit(props, [
      "prevButtonStyle",
      "borderRadius",
      "boxShadow",
      "boxShadowColor",
      "buttonColor",
      "buttonStyle",
      "buttonVariant",
    ])}
  />
))<ThemeProp & ButtonStyleProps>`
  height: 100%;
  background-image: none !important;
  font-weight: ${(props) => props.theme.fontWeights[2]};
  outline: none;
  padding: 0px 10px;

  ${({ buttonColor, buttonStyle, buttonVariant, prevButtonStyle, theme }) => `
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
          : buttonStyle === ButtonStyleTypes.CUSTOM
          ? getCustomBackgroundColor(
              theme,
              prevButtonStyle,
              buttonVariant,
              buttonColor,
            )
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
          : buttonStyle === ButtonStyleTypes.CUSTOM
          ? getCustomHoverColor(
              theme,
              prevButtonStyle,
              buttonVariant,
              buttonColor,
            )
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
          : buttonStyle === ButtonStyleTypes.CUSTOM
          ? `1px solid ${getCustomBorderColor(
              theme,
              prevButtonStyle,
              buttonVariant,
              buttonColor,
            )}`
          : `1px solid ${theme.colors.button.primary.outline.borderColor}`
        : "none"
    } !important;

    & > span {
      max-height: 100%;
      max-width: 99%;
      text-overflow: ellipsis;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;

      color: ${
        buttonVariant === ButtonVariantTypes.SOLID
          ? buttonStyle === ButtonStyleTypes.CUSTOM
            ? getCustomTextColor(theme, buttonColor, prevButtonStyle)
            : `${theme.colors.button.primary.solid.textColor}`
          : buttonStyle === ButtonStyleTypes.WARNING
          ? `${theme.colors.button.warning.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.DANGER
          ? `${theme.colors.button.danger.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.INFO
          ? `${theme.colors.button.info.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? `${theme.colors.button.secondary.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.CUSTOM
          ? getCustomBackgroundColor(
              theme,
              prevButtonStyle,
              ButtonVariantTypes.SOLID,
              buttonColor,
            )
          : `${theme.colors.button.primary.outline.textColor}`
      } !important;
    }
  `}


  border-radius: ${({ borderRadius }) =>
    borderRadius === ButtonBorderRadiusTypes.ROUNDED ? "5px" : 0};

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

type ButtonStyleProps = {
  buttonColor?: string;
  buttonStyle?: ButtonStyleType;
  prevButtonStyle?: ButtonStyleType;
  buttonVariant?: ButtonVariant;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  borderRadius?: ButtonBorderRadius;
  iconName?: IconName;
  iconAlign?: Alignment;
};

// To be used in any other part of the app
export function BaseButton(props: IButtonProps & ButtonStyleProps) {
  const {
    borderRadius,
    boxShadow,
    boxShadowColor,
    buttonColor,
    buttonStyle,
    buttonVariant,
    className,
    disabled,
    icon,
    iconAlign,
    iconName,
    loading,
    onClick,
    prevButtonStyle,
    rightIcon,
    text,
  } = props;

  if (iconAlign === Alignment.RIGHT) {
    return (
      <StyledButton
        alignText={iconName ? Alignment.LEFT : Alignment.CENTER}
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        boxShadowColor={boxShadowColor}
        buttonColor={buttonColor}
        buttonStyle={buttonStyle}
        buttonVariant={buttonVariant}
        className={className}
        disabled={disabled}
        fill
        icon={icon}
        loading={loading}
        onClick={onClick}
        prevButtonStyle={prevButtonStyle}
        rightIcon={iconName || rightIcon}
        text={text}
      />
    );
  }

  return (
    <StyledButton
      alignText={iconName ? Alignment.RIGHT : Alignment.CENTER}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      boxShadowColor={boxShadowColor}
      buttonColor={buttonColor}
      buttonStyle={buttonStyle}
      buttonVariant={buttonVariant}
      className={className}
      disabled={disabled}
      fill
      icon={iconName || icon}
      loading={loading}
      onClick={onClick}
      prevButtonStyle={prevButtonStyle}
      rightIcon={rightIcon}
      text={text}
    />
  );
}

BaseButton.defaultProps = {
  buttonStyle: "SECONDARY",
  buttonVariant: "SOLID",
  disabled: false,
  text: "Button Text",
  minimal: true,
};
