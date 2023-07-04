import * as React from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  Alignment,
  Button,
  Classes as BlueprintCoreClasses,
  Icon,
  Menu,
  MenuItem as BlueprintMenuItem,
  Classes as BlueprintClasses,
} from "@blueprintjs/core";
import { Classes, Popover2 } from "@blueprintjs/popover2";
import type { IconName } from "@blueprintjs/icons";
import {
  getCustomBackgroundColor,
  getCustomBorderColor,
  getCustomHoverColor,
  lightenColor,
  getComplementaryGrayscaleColor,
} from "widgets/WidgetUtils";
import { darkenActive, darkenHover } from "constants/DefaultTheme";
import type { ButtonVariant } from "components/constants";
import { ButtonVariantTypes } from "components/constants";
import tinycolor from "tinycolor2";
import { Colors } from "constants/Colors";
import {
  getBooleanPropertyValue,
  getPropertyValue,
} from "widgets/TableWidgetV2/widget/utilities";
import type { ThemeProp } from "widgets/constants";
import type {
  ConfigureMenuItems,
  MenuItem,
  MenuItems,
  MenuItemsSource,
} from "widgets/MenuButtonWidget/constants";

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
    & .${BlueprintClasses.MENU_ITEM} {
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
  boxShadowColor?: string;
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  isCompact?: boolean;
  textColor?: string;
  compactMode?: string;
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
  min-height: ${({ compactMode }) =>
    compactMode === "SHORT" ? "24px" : "30px"};
  font-size: ${({ compactMode }) =>
    compactMode === "SHORT" ? "12px" : "14px"};
  line-height: ${({ compactMode }) =>
    compactMode === "SHORT" ? "24px" : "28px"};

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

    &:hover:enabled, &:active:enabled, &:focus:enabled {
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

const BaseMenuItem = styled(BlueprintMenuItem)<ThemeProp & BaseStyleProps>`
  &.${BlueprintCoreClasses.MENU_ITEM}.${BlueprintCoreClasses.DISABLED} {
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
  onItemClicked: (
    onClick: string | undefined,
    index?: number,
    onComplete?: () => void,
  ) => void;
  getVisibleItems: (rowIndex: number) => Array<MenuItem>;
  isCompact?: boolean;
  rowIndex: number;
  menuItemsSource: MenuItemsSource;
  configureMenuItems: ConfigureMenuItems;
  sourceData?: Array<Record<string, unknown>>;
}

function PopoverContent(props: PopoverContentProps) {
  const { getVisibleItems, isCompact, onItemClicked, rowIndex } = props;

  const visibleItems = getVisibleItems(rowIndex);

  if (!visibleItems?.length) {
    return <StyledMenu />;
  } else {
    const listItems = visibleItems.map((item: MenuItem, index: number) => {
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
      } = item;

      return (
        <BaseMenuItem
          backgroundColor={
            getPropertyValue(backgroundColor, rowIndex) || "#FFFFFF"
          }
          disabled={getBooleanPropertyValue(isDisabled, rowIndex)}
          icon={
            iconAlign !== Alignment.RIGHT && iconName ? (
              <Icon color={iconColor} icon={iconName} />
            ) : undefined
          }
          isCompact={isCompact}
          key={id}
          labelElement={
            iconAlign === Alignment.RIGHT && iconName ? (
              <Icon color={iconColor} icon={iconName} />
            ) : undefined
          }
          onClick={() => onItemClicked(onClick, index)}
          text={label}
          textColor={getPropertyValue(textColor, rowIndex)}
        />
      );
    });

    return <StyledMenu>{listItems}</StyledMenu>;
  }
}

interface PopoverTargetButtonProps {
  borderRadius?: string;
  boxShadow?: string;
  boxShadowColor?: string;
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  iconName?: IconName;
  iconAlign?: Alignment;
  isDisabled?: boolean;
  label?: string;
  compactMode?: string;
}

function PopoverTargetButton(props: PopoverTargetButtonProps) {
  const {
    borderRadius,
    boxShadow,
    buttonColor,
    buttonVariant,
    compactMode,
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
      compactMode={compactMode}
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
  getVisibleItems: (rowIndex: number) => Array<MenuItem>;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  boxShadowColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  onItemClicked: (
    onClick: string | undefined,
    index?: number,
    onComplete?: () => void,
  ) => void;
  rowIndex: number;
  compactMode?: string;
  menuItemsSource: MenuItemsSource;
  configureMenuItems: ConfigureMenuItems;
  sourceData?: Array<Record<string, unknown>>;
}

function MenuButtonTableComponent(props: MenuButtonComponentProps) {
  const {
    borderRadius = "0px",
    boxShadow,
    boxShadowColor,
    compactMode,
    configureMenuItems,
    getVisibleItems,
    iconAlign,
    iconName,
    isCompact,
    isDisabled,
    label,
    menuColor = "#e1e1e1",
    menuItems,
    menuItemsSource,
    menuVariant,
    onItemClicked,
    rowIndex,
    sourceData,
  } = props;

  return (
    <MenuButtonContainer
      onClick={(e) => {
        //Stop propagating event so selectedRow will remain unchanged
        e.stopPropagation();
      }}
    >
      <PopoverStyles accentColor={menuColor} borderRadius={borderRadius} />
      <Popover2
        backdropProps={{
          className: "table-menu-button-popover-backdrop",
        }}
        content={
          <PopoverContent
            configureMenuItems={configureMenuItems}
            getVisibleItems={getVisibleItems}
            isCompact={isCompact}
            menuItems={menuItems}
            menuItemsSource={menuItemsSource}
            onItemClicked={onItemClicked}
            rowIndex={rowIndex}
            sourceData={sourceData}
          />
        }
        disabled={isDisabled}
        fill
        minimal
        placement="bottom-end"
        popoverClassName="table-menu-button-popover"
      >
        <PopoverTargetButton
          borderRadius={borderRadius}
          boxShadow={boxShadow}
          boxShadowColor={boxShadowColor}
          buttonColor={menuColor}
          buttonVariant={menuVariant}
          compactMode={compactMode}
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
