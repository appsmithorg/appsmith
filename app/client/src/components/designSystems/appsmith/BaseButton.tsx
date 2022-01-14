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
    ][(buttonVariant || ButtonVariantTypes.PRIMARY).toLowerCase()].hoverColor;
  }

  switch (buttonVariant) {
    case ButtonVariantTypes.SECONDARY:
      return backgroundColor
        ? tinycolor(backgroundColor)
            .lighten(40)
            .toString()
        : theme.colors.button.primary.secondary.hoverColor;

    case ButtonVariantTypes.TERTIARY:
      return backgroundColor
        ? tinycolor(backgroundColor)
            .lighten(40)
            .toString()
        : theme.colors.button.primary.tertiary.hoverColor;

    default:
      return backgroundColor
        ? tinycolor(backgroundColor)
            .darken(10)
            .toString()
        : theme.colors.button.primary.primary.hoverColor;
  }
};

const getCustomBackgroundColor = (
  theme: Theme,
  prevButtonStyle?: ButtonStyleType,
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  return buttonVariant === ButtonVariantTypes.PRIMARY
    ? backgroundColor
      ? backgroundColor
      : theme.colors.button[
          (prevButtonStyle || ButtonStyleTypes.PRIMARY).toLowerCase()
        ].primary.bgColor
    : "none";
};

const getCustomBorderColor = (
  theme: Theme,
  prevButtonStyle?: ButtonStyleType,
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  return buttonVariant === ButtonVariantTypes.SECONDARY
    ? backgroundColor
      ? backgroundColor
      : theme.colors.button[
          (prevButtonStyle || ButtonStyleTypes.PRIMARY).toLowerCase()
        ].secondary.borderColor
    : "none";
};

const StyledButton = styled((props) => (
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
          ? buttonVariant === ButtonVariantTypes.PRIMARY
            ? theme.colors.button.warning.primary.bgColor
            : "none"
          : buttonStyle === ButtonStyleTypes.DANGER
          ? buttonVariant === ButtonVariantTypes.PRIMARY
            ? theme.colors.button.danger.primary.bgColor
            : "none"
          : buttonStyle === ButtonStyleTypes.INFO
          ? buttonVariant === ButtonVariantTypes.PRIMARY
            ? theme.colors.button.info.primary.bgColor
            : "none"
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? buttonVariant === ButtonVariantTypes.PRIMARY
            ? theme.colors.button.secondary.primary.bgColor
            : "none"
          : buttonStyle === ButtonStyleTypes.CUSTOM
          ? getCustomBackgroundColor(
              theme,
              prevButtonStyle,
              buttonVariant,
              buttonColor,
            )
          : buttonVariant === ButtonVariantTypes.PRIMARY
          ? theme.colors.button.primary.primary.bgColor
          : "none"
      } !important;
    }

    &:hover:enabled, &:active:enabled {
      background: ${
        buttonStyle === ButtonStyleTypes.WARNING
          ? buttonVariant === ButtonVariantTypes.SECONDARY
            ? theme.colors.button.warning.secondary.hoverColor
            : buttonVariant === ButtonVariantTypes.TERTIARY
            ? theme.colors.button.warning.tertiary.hoverColor
            : theme.colors.button.warning.primary.hoverColor
          : buttonStyle === ButtonStyleTypes.DANGER
          ? buttonVariant === ButtonVariantTypes.PRIMARY
            ? theme.colors.button.danger.primary.hoverColor
            : theme.colors.button.danger.secondary.hoverColor
          : buttonStyle === ButtonStyleTypes.INFO
          ? buttonVariant === ButtonVariantTypes.PRIMARY
            ? theme.colors.button.info.primary.hoverColor
            : theme.colors.button.info.secondary.hoverColor
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? buttonVariant === ButtonVariantTypes.SECONDARY
            ? theme.colors.button.secondary.secondary.hoverColor
            : buttonVariant === ButtonVariantTypes.TERTIARY
            ? theme.colors.button.secondary.tertiary.hoverColor
            : theme.colors.button.secondary.primary.hoverColor
          : buttonStyle === ButtonStyleTypes.CUSTOM
          ? getCustomHoverColor(
              theme,
              prevButtonStyle,
              buttonVariant,
              buttonColor,
            )
          : buttonVariant === ButtonVariantTypes.SECONDARY
          ? theme.colors.button.primary.secondary.hoverColor
          : buttonVariant === ButtonVariantTypes.TERTIARY
          ? theme.colors.button.primary.tertiary.hoverColor
          : theme.colors.button.primary.primary.hoverColor
      } !important;
      border-color: var(--appsmith-input-focus-border-color) !important;
    }

    &:disabled {
      background-color: ${theme.colors.button.disabled.bgColor} !important;
      color: ${theme.colors.button.disabled.textColor} !important;
    }

    border: ${
      buttonVariant === ButtonVariantTypes.SECONDARY
        ? buttonStyle === ButtonStyleTypes.WARNING
          ? `1px solid ${theme.colors.button.warning.secondary.borderColor}`
          : buttonStyle === ButtonStyleTypes.DANGER
          ? `1px solid ${theme.colors.button.danger.secondary.borderColor}`
          : buttonStyle === ButtonStyleTypes.INFO
          ? `1px solid ${theme.colors.button.info.secondary.borderColor}`
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? `1px solid ${theme.colors.button.secondary.secondary.borderColor}`
          : buttonStyle === ButtonStyleTypes.CUSTOM
          ? `1px solid ${getCustomBorderColor(
              theme,
              prevButtonStyle,
              buttonVariant,
              buttonColor,
            )}`
          : `1px solid ${theme.colors.button.primary.secondary.borderColor}`
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
        buttonVariant === ButtonVariantTypes.PRIMARY
          ? buttonStyle === ButtonStyleTypes.CUSTOM
            ? getCustomTextColor(theme, buttonColor, prevButtonStyle)
            : `${theme.colors.button.primary.primary.textColor}`
          : buttonStyle === ButtonStyleTypes.WARNING
          ? `${theme.colors.button.warning.secondary.textColor}`
          : buttonStyle === ButtonStyleTypes.DANGER
          ? `${theme.colors.button.danger.secondary.textColor}`
          : buttonStyle === ButtonStyleTypes.INFO
          ? `${theme.colors.button.info.secondary.textColor}`
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? `${theme.colors.button.secondary.secondary.textColor}`
          : buttonStyle === ButtonStyleTypes.CUSTOM
          ? getCustomBackgroundColor(
              theme,
              prevButtonStyle,
              ButtonVariantTypes.PRIMARY,
              buttonColor,
            )
          : `${theme.colors.button.primary.secondary.textColor}`
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
  buttonVariant: ButtonVariantTypes.PRIMARY,
  disabled: false,
  text: "Button Text",
  minimal: true,
};
