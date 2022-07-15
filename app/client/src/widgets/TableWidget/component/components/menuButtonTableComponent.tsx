import * as React from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  Alignment,
  Button,
  Classes as CoreClasses,
  Icon,
  Menu,
  MenuItem,
  Classes as BClasses,
} from "@blueprintjs/core";
import { Classes, Popover2 } from "@blueprintjs/popover2";
import { IconName } from "@blueprintjs/icons";
import {
  getCustomBackgroundColor,
  getCustomBorderColor,
  getCustomHoverColor,
  lightenColor,
  getComplementaryGrayscaleColor,
} from "widgets/WidgetUtils";
import { darkenActive, darkenHover } from "constants/DefaultTheme";
import { ThemeProp } from "components/ads/common";
import { ButtonVariant, ButtonVariantTypes } from "components/constants";
import { MenuItems } from "../Constants";
import tinycolor from "tinycolor2";
import { Colors } from "constants/Colors";
import orderBy from "lodash/orderBy";

const MenuButtonContainer = styled.div`
  width: 100%;
  height: 100%;
  text-align: center;

  & > .${Classes.POPOVER2_TARGET} {
    height: 100%;
  }
`;

const PopoverStyles = createGlobalStyle<{
  borderRadius: string;
  accentColor: string;
}>`
   .table-menu-button-popover {
     box-shadow: none;

     & > .${Classes.POPOVER2_CONTENT} {
      background: none;
      box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
      margin-top: 8px !important;
      border-radius: ${({ borderRadius }) =>
        borderRadius >= `1.5rem` ? `0.375rem` : borderRadius};
      overflow: hidden;
    }

    & .${BClasses.MENU_ITEM} {
      padding: 9px 12px;
      border-radius: 0;

      &:hover {
        background-color:  ${({ accentColor }) => lightenColor(accentColor)};
      }
    }
   }

  .table-menu-button-popover-backdrop {
    background-color: transparent !important;
  }
`;

interface BaseStyleProps {
  backgroundColor?: string;
  borderRadius?: string;
  boxShadow?: string;

  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  isCompact?: boolean;
  textColor?: string;
}

const BaseButton = styled(Button)<ThemeProp & BaseStyleProps>`
  height: 100%;
  background-image: none !important;
  font-weight: 400;
  outline: none;
  padding: 0px 10px;
  overflow: hidden;
  border: 1.2px solid #ebebeb;
  border-radius: 0;
  box-shadow: none !important;

  ${({ buttonColor, buttonVariant, theme }) => `
    &:enabled {
      background: ${
        getCustomBackgroundColor(buttonVariant, buttonColor) !== "none"
          ? getCustomBackgroundColor(buttonVariant, buttonColor)
          : buttonVariant === ButtonVariantTypes.PRIMARY
          ? theme.colors.button.primary.primary.bgColor
          : "none"
      } !important;
    }

    &:hover:enabled, &:active:enabled {
      background: ${
        getCustomHoverColor(theme, buttonVariant, buttonColor) !== "none"
          ? getCustomHoverColor(theme, buttonVariant, buttonColor)
          : buttonVariant === ButtonVariantTypes.SECONDARY
          ? theme.colors.button.primary.secondary.hoverColor
          : buttonVariant === ButtonVariantTypes.TERTIARY
          ? theme.colors.button.primary.tertiary.hoverColor
          : theme.colors.button.primary.primary.hoverColor
      } !important;
    }

    &:disabled {
      background-color: ${theme.colors.button.disabled.bgColor} !important;
      color: ${theme.colors.button.disabled.textColor} !important;
      > span {
        color: ${theme.colors.button.disabled.textColor} !important;
      }
    }

    border: ${
      getCustomBorderColor(buttonVariant, buttonColor) !== "none"
        ? `1px solid ${getCustomBorderColor(buttonVariant, buttonColor)}`
        : buttonVariant === ButtonVariantTypes.SECONDARY
        ? `1px solid ${theme.colors.button.primary.secondary.borderColor}`
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
          ? getComplementaryGrayscaleColor(buttonColor)
          : getCustomBackgroundColor(ButtonVariantTypes.PRIMARY, buttonColor)
      } !important;
    }
  `}
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
`;

const BaseMenuItem = styled(MenuItem)<ThemeProp & BaseStyleProps>`
  &.${CoreClasses.MENU_ITEM}.${CoreClasses.DISABLED} {
    background-color: ${Colors.GREY_1} !important;
  }
  ${({ backgroundColor, theme }) =>
    backgroundColor
      ? `
      background-color: ${backgroundColor} !important;
      &:hover {
        background-color: ${darkenHover(backgroundColor)} !important;
      }
      &:active {
        background-color: ${darkenActive(backgroundColor)} !important;
      }
  `
      : `
    background: none !important
      &:hover {
        background-color: ${tinycolor(
          theme.colors.button.primary.primary.textColor,
        )
          .darken()
          .toString()} !important;
      }
      &:active {
        background-color: ${tinycolor(
          theme.colors.button.primary.primary.textColor,
        )
          .darken()
          .toString()} !important;
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
      padding-top: 3px !important;
      padding-bottom: 3px !important;
      font-size: 12px;
  `}
`;

const StyledMenu = styled(Menu)`
  padding: 0;
  background: none;
`;

interface PopoverContentProps {
  menuItems: MenuItems;
  onItemClicked: (onClick: string | undefined) => void;
  isCompact?: boolean;
}

function PopoverContent(props: PopoverContentProps) {
  const { isCompact, menuItems: itemsObj, onItemClicked } = props;

  if (!itemsObj) return <StyledMenu />;
  const visibleItems = Object.keys(itemsObj)
    .map((itemKey) => itemsObj[itemKey])
    .filter((item) => item.isVisible === true);

  const items = orderBy(visibleItems, ["index"], ["asc"]);

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

    return (
      <BaseMenuItem
        backgroundColor={backgroundColor || "#FFFFFF"}
        disabled={isDisabled}
        icon={
          iconAlign !== Alignment.RIGHT ? (
            <Icon color={iconColor} icon={iconName} />
          ) : (
            undefined
          )
        }
        isCompact={isCompact}
        key={id}
        labelElement={
          iconAlign === Alignment.RIGHT ? (
            <Icon color={iconColor} icon={iconName} />
          ) : (
            undefined
          )
        }
        onClick={() => onItemClicked(onClick)}
        text={label}
        textColor={textColor}
      />
    );
  });

  return <StyledMenu>{listItems}</StyledMenu>;
}

interface PopoverTargetButtonProps {
  borderRadius?: string;
  boxShadow?: string;

  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  iconName?: IconName;
  iconAlign?: Alignment;
  isDisabled?: boolean;
  label?: string;
}

function PopoverTargetButton(props: PopoverTargetButtonProps) {
  const {
    borderRadius,
    boxShadow,

    buttonColor,

    buttonVariant,
    iconAlign,
    iconName,
    isDisabled,
    label,
  } = props;

  return (
    <BaseButton
      alignText={iconName ? Alignment.LEFT : Alignment.CENTER}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      buttonColor={buttonColor}
      buttonVariant={buttonVariant}
      disabled={isDisabled}
      fill
      icon={iconAlign !== Alignment.RIGHT ? iconName : undefined}
      rightIcon={iconAlign === Alignment.RIGHT ? iconName : undefined}
      text={label}
    />
  );
}

export interface MenuButtonComponentProps {
  label?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  isCompact?: boolean;
  menuItems: MenuItems;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  borderRadius?: string;
  boxShadow?: string;

  iconName?: IconName;
  iconAlign?: Alignment;
  onItemClicked: (onClick: string | undefined) => void;
}

function MenuButtonTableComponent(props: MenuButtonComponentProps) {
  const {
    borderRadius = "0px",
    boxShadow,
    iconAlign,
    iconName,
    isCompact,
    isDisabled,
    label,
    menuColor = "#e1e1e1",
    menuItems,
    menuVariant,
    onItemClicked,
  } = props;

  return (
    <MenuButtonContainer>
      <PopoverStyles accentColor={menuColor} borderRadius={borderRadius} />
      <Popover2
        backdropProps={{
          className: "table-menu-button-popover-backdrop",
        }}
        content={
          <PopoverContent
            isCompact={isCompact}
            menuItems={menuItems}
            onItemClicked={onItemClicked}
          />
        }
        disabled={isDisabled}
        fill
        hasBackdrop
        minimal
        placement="bottom-end"
        popoverClassName="table-menu-button-popover"
      >
        <PopoverTargetButton
          borderRadius={borderRadius}
          boxShadow={boxShadow}
          buttonColor={menuColor}
          buttonVariant={menuVariant}
          iconAlign={iconAlign}
          iconName={iconName}
          isDisabled={isDisabled}
          label={label}
        />
      </Popover2>
    </MenuButtonContainer>
  );
}

export default MenuButtonTableComponent;
