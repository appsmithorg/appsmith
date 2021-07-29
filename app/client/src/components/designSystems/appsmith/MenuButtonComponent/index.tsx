import * as React from "react";
import styled from "styled-components";
import { Alignment, Button, Icon, Menu, MenuItem } from "@blueprintjs/core";
import { Classes, Popover2 } from "@blueprintjs/popover2";
import { IconName } from "@blueprintjs/icons";
import tinycolor from "tinycolor2";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { darkenActive, darkenHover, Theme } from "constants/DefaultTheme";
import {
  ButtonBoxShadow,
  ButtonBoxShadowTypes,
} from "components/propertyControls/BoxShadowOptionsControl";
import {
  ButtonBorderRadius,
  ButtonBorderRadiusTypes,
} from "components/propertyControls/ButtonBorderRadiusControl";
import {
  ButtonStyle,
  ButtonStyleTypes,
  ButtonVariant,
  ButtonVariantTypes,
} from "constants/WidgetConstants";
import { ThemeProp } from "components/ads/common";

const getCustomTextColor = (
  theme: Theme,
  backgroundColor?: string,
  prevButtonStyle?: ButtonStyle,
) => {
  if (!backgroundColor)
    return prevButtonStyle
      ? theme.colors.button[prevButtonStyle.toLowerCase()].solid.textColor
      : theme.colors.button.custom.solid.dark.textColor;

  const isDark = tinycolor(backgroundColor).isDark();
  if (isDark) {
    return theme.colors.button.custom.solid.light.textColor;
  }
  return theme.colors.button.custom.solid.dark.textColor;
};

const getCustomHoverColor = (
  theme: Theme,
  prevButtonStyle?: ButtonStyle,
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  if (!backgroundColor) {
    return prevButtonStyle
      ? theme.colors.button[prevButtonStyle.toLowerCase()][
          (buttonVariant || ButtonVariantTypes.SOLID).toLowerCase()
        ].hoverColor
      : tinycolor(theme.colors.button.primary.solid.textColor)
          .darken()
          .toString();
  }
  switch (buttonVariant) {
    case ButtonVariantTypes.OUTLINE:
      return backgroundColor
        ? tinycolor(backgroundColor)
            .lighten(40)
            .toString()
        : theme.colors.button.primary.outline.hoverColor;
      break;
    case ButtonVariantTypes.GHOST:
      return backgroundColor
        ? tinycolor(backgroundColor)
            .lighten(40)
            .toString()
        : theme.colors.button.primary.ghost.hoverColor;
      break;

    default:
      return backgroundColor
        ? tinycolor(backgroundColor)
            .darken(10)
            .toString()
        : theme.colors.button.primary.solid.hoverColor;
      break;
  }
};

const getCustomBackgroundColor = (
  theme: Theme,
  prevButtonStyle?: ButtonStyle,
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  return buttonVariant === ButtonVariantTypes.SOLID
    ? backgroundColor
      ? backgroundColor
      : prevButtonStyle
      ? theme.colors.button[prevButtonStyle.toLowerCase()].solid.bgColor
      : "none"
    : "none";
};

const getCustomBorderColor = (
  theme: Theme,
  prevButtonStyle?: ButtonStyle,
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  return buttonVariant === ButtonVariantTypes.OUTLINE
    ? backgroundColor
      ? backgroundColor
      : prevButtonStyle
      ? theme.colors.button[prevButtonStyle.toLowerCase()].outline.borderColor
      : "none"
    : "none";
};

export const MenuButtonContainer = styled.div`
  width: 100%;
  height: 100%;
  text-align: center;

  & > .${Classes.POPOVER2_TARGET} {
    height: 100%;
  }
`;

export interface BaseStyleProps {
  backgroundColor?: string;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  buttonColor?: string;
  buttonStyle?: ButtonStyle;
  buttonVariant?: ButtonVariant;
  isCompact?: boolean;
  prevButtonStyle?: ButtonStyle;
  textColor?: string;
}

const BaseButton = styled(Button)<ThemeProp & BaseStyleProps>`
  height: 100%;
  background-image: none !important;
  font-weight: ${(props) => props.theme.fontWeights[2]};
  outline: none;
  padding: 0px 10px;
  overflow: hidden;
  border: 1.2px solid #ebebeb;
  border-radius: 0;
  box-shadow: none !important;

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
      max-width: 99%;
      text-overflow: ellipsis;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;

      max-height: 100%;
      overflow: hidden;
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

const BaseMenuItem = styled(MenuItem)<BaseStyleProps>`
  ${({ backgroundColor }) =>
    backgroundColor &&
    `
      background-color: ${backgroundColor} !important;
      &:hover {
        background-color: ${darkenHover(backgroundColor)} !important;
      }
      &:active {
        background-color: ${darkenActive(backgroundColor)} !important;
      }
  `}
  ${({ textColor }) =>
    textColor &&
    `
      color: ${textColor} !important;
  `}
  ${({ isCompact }) =>
    isCompact &&
    `
      padding-top: 3px;
      padding-bottom: 3px;
      font-size: 12px;
  `}
`;

const StyledMenu = styled(Menu)`
  padding: 0;
`;

export interface PopoverContentProps {
  menuItems: Record<
    string,
    {
      widgetId: string;
      id: string;
      index: number;
      isVisible?: boolean;
      isDisabled?: boolean;
      label?: string;
      backgroundColor?: string;
      textColor?: string;
      iconName?: IconName;
      iconColor?: string;
      iconAlign?: Alignment;
      onClick?: string;
    }
  >;
  onItemClicked: (onClick: string | undefined) => void;
  isCompact?: boolean;
}

function PopoverContent(props: PopoverContentProps) {
  const { isCompact, menuItems: itemsObj, onItemClicked } = props;

  const items = Object.keys(itemsObj)
    .map((itemKey) => itemsObj[itemKey])
    .filter((item) => item.isVisible === true);

  const listItems = items.map((menuItem) => {
    const {
      backgroundColor,
      iconAlign,
      iconColor,
      iconName,
      id,
      isDisabled,
      label,
      onClick,
      textColor,
    } = menuItem;
    if (iconAlign === Alignment.RIGHT) {
      return (
        <BaseMenuItem
          backgroundColor={backgroundColor}
          disabled={isDisabled}
          isCompact={isCompact}
          key={id}
          labelElement={<Icon color={iconColor} icon={iconName} />}
          onClick={() => onItemClicked(onClick)}
          text={label}
          textColor={textColor}
        />
      );
    }
    return (
      <BaseMenuItem
        backgroundColor={backgroundColor}
        disabled={isDisabled}
        icon={<Icon color={iconColor} icon={iconName} />}
        isCompact={isCompact}
        key={id}
        onClick={() => onItemClicked(onClick)}
        text={label}
        textColor={textColor}
      />
    );
  });

  return <StyledMenu>{listItems}</StyledMenu>;
}

export interface PopoverTargetButtonProps {
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  buttonStyle?: ButtonStyle;
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  iconName?: IconName;
  iconAlign?: Alignment;
  isDisabled?: boolean;
  label?: string;
  prevButtonStyle?: ButtonStyle;
}

function PopoverTargetButton(props: PopoverTargetButtonProps) {
  const {
    borderRadius,
    boxShadow,
    boxShadowColor,
    buttonColor,
    buttonStyle,
    buttonVariant,
    iconAlign,
    iconName,
    isDisabled,
    label,
    prevButtonStyle,
  } = props;

  if (iconAlign === Alignment.RIGHT) {
    return (
      <BaseButton
        alignText={iconName ? Alignment.LEFT : Alignment.CENTER}
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        boxShadowColor={boxShadowColor}
        buttonColor={buttonColor}
        buttonStyle={buttonStyle}
        buttonVariant={buttonVariant}
        disabled={isDisabled}
        fill
        prevButtonStyle={prevButtonStyle}
        rightIcon={iconName}
        text={label}
      />
    );
  }

  return (
    <BaseButton
      alignText={iconName ? Alignment.RIGHT : Alignment.CENTER}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      boxShadowColor={boxShadowColor}
      buttonColor={buttonColor}
      buttonStyle={buttonStyle}
      buttonVariant={buttonVariant}
      disabled={isDisabled}
      fill
      icon={iconName}
      prevButtonStyle={prevButtonStyle}
      text={label}
    />
  );
}

export interface MenuButtonComponentProps extends ComponentProps {
  label?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  isCompact?: boolean;
  menuItems: Record<
    string,
    {
      widgetId: string;
      id: string;
      index: number;
      isVisible?: boolean;
      isDisabled?: boolean;
      label?: string;
      backgroundColor?: string;
      textColor?: string;
      iconName?: IconName;
      iconColor?: string;
      iconAlign?: Alignment;
      onClick?: string;
    }
  >;
  menuStyle?: ButtonStyle;
  prevMenuStyle?: ButtonStyle;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  onItemClicked: (onClick: string | undefined) => void;
}

function MenuButtonComponent(props: MenuButtonComponentProps) {
  const {
    borderRadius,
    boxShadow,
    boxShadowColor,
    iconAlign,
    iconName,
    isCompact,
    isDisabled,
    label,
    menuColor,
    menuItems,
    menuStyle,
    menuVariant,
    onItemClicked,
    prevMenuStyle,
  } = props;

  return (
    <MenuButtonContainer>
      <Popover2
        content={
          <PopoverContent
            isCompact={isCompact}
            menuItems={menuItems}
            onItemClicked={onItemClicked}
          />
        }
        disabled={isDisabled}
        fill
        minimal
        placement="bottom-end"
      >
        <PopoverTargetButton
          borderRadius={borderRadius}
          boxShadow={boxShadow}
          boxShadowColor={boxShadowColor}
          buttonColor={menuColor}
          buttonStyle={menuStyle}
          buttonVariant={menuVariant}
          iconAlign={iconAlign}
          iconName={iconName}
          isDisabled={isDisabled}
          label={label}
          prevButtonStyle={prevMenuStyle}
        />
      </Popover2>
    </MenuButtonContainer>
  );
}

export default MenuButtonComponent;
