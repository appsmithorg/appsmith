import * as React from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  Alignment,
  Button,
  Icon,
  Menu,
  MenuItem as BlueprintMenuItem,
  Classes as BlueprintClasses,
} from "@blueprintjs/core";
import { Classes, Popover2 } from "@blueprintjs/popover2";
import { IconName } from "@blueprintjs/icons";
import tinycolor from "tinycolor2";

import { darkenActive, darkenHover } from "constants/DefaultTheme";
import {
  ButtonPlacement,
  ButtonVariant,
  ButtonVariantTypes,
} from "components/constants";
import {
  getCustomBackgroundColor,
  getCustomBorderColor,
  getCustomHoverColor,
  getComplementaryGrayscaleColor,
  getCustomJustifyContent,
  getAlignText,
  WidgetContainerDiff,
  lightenColor,
} from "widgets/WidgetUtils";
import { RenderMode } from "constants/WidgetConstants";
import { DragContainer } from "widgets/ButtonWidget/component/DragContainer";
import { THEMEING_TEXT_SIZES } from "constants/ThemeConstants";
import {
  MenuButtonComponentProps,
  MenuItem,
  PopoverContentProps,
} from "../constants";
import { ThemeProp } from "widgets/constants";

const PopoverStyles = createGlobalStyle<{
  parentWidth: number;
  menuDropDownWidth: number;
  id: string;
  borderRadius: string;
}>`
  .menu-button-popover, .${BlueprintClasses.MINIMAL}.menu-button-popover.${
  Classes.POPOVER2
} {
    background: none;
    box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
    margin-top: 8px !important;
    margin-bottom: 8px !important;
    border-radius: ${({ borderRadius }) =>
      borderRadius >= THEMEING_TEXT_SIZES.lg ? `0.375rem` : borderRadius};
    overflow: hidden;
  }

  .menu-button-popover .${BlueprintClasses.MENU_ITEM} {
    padding: 9px 12px;
    border-radius: 0;
  }

  & > .${Classes.POPOVER2_TARGET} {
    height: 100%;
  }

  ${({ id, menuDropDownWidth, parentWidth }) => `
  .menu-button-width-${id} {

    max-width: ${
      menuDropDownWidth > parentWidth
        ? `${menuDropDownWidth}px`
        : `${parentWidth}px`
    } !important;
    min-width: ${
      parentWidth > menuDropDownWidth ? parentWidth : menuDropDownWidth
    }px !important;
  }
`}
`;

export interface BaseStyleProps {
  backgroundColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  isCompact?: boolean;
  textColor?: string;
  placement?: ButtonPlacement;
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

  ${({ buttonColor, buttonVariant, theme }) => `
      background: ${
        getCustomBackgroundColor(buttonVariant, buttonColor) !== "none"
          ? getCustomBackgroundColor(buttonVariant, buttonColor)
          : buttonVariant === ButtonVariantTypes.PRIMARY
          ? theme.colors.button.primary.primary.bgColor
          : "none"
      } !important;

    &:hover, &:active {
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
      border: ${
        buttonVariant === ButtonVariantTypes.SECONDARY
          ? "1px solid var(--wds-color-border-disabled)"
          : "none"
      } !important;
      background: ${
        buttonVariant !== ButtonVariantTypes.TERTIARY
          ? "var(--wds-color-bg-disabled)"
          : "transparent"
      } !important;
      color: var(--wds-color-text-disabled) !important;

      span {
        color: var(--wds-color-text-disabled) !important;
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
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;

      max-height: 100%;
      overflow: hidden;
      color: ${
        buttonVariant === ButtonVariantTypes.PRIMARY
          ? getComplementaryGrayscaleColor(buttonColor)
          : getCustomBackgroundColor(
              ButtonVariantTypes.PRIMARY,
              buttonColor,
            ) !== "none"
          ? getCustomBackgroundColor(ButtonVariantTypes.PRIMARY, buttonColor)
          : `${theme.colors.button.primary.secondary.textColor}`
      } !important;
    }
  `}

  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => boxShadow}  !important;
  ${({ placement }) =>
    placement
      ? `
      justify-content: ${getCustomJustifyContent(placement)};
      & > span.bp3-button-text {
        flex: unset !important;
      }
    `
      : ""}
`;

const BaseMenuItem = styled(BlueprintMenuItem)<ThemeProp & BaseStyleProps>`
  font-family: var(--wds-font-family);

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

const StyledMenu = styled(Menu)<{
  backgroundColor?: string;
}>`
  padding: 0;
  min-width: 0px;
  overflow: hidden;

  ${BlueprintClasses.MENU_ITEM}:hover {
    background-color: ${({ backgroundColor }) => lightenColor(backgroundColor)};
  }
`;

function PopoverContent(props: PopoverContentProps) {
  const { backgroundColor, getVisibleItems, isCompact, onItemClicked } = props;

  const visibleItems = getVisibleItems();

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
          backgroundColor={backgroundColor}
          disabled={isDisabled}
          icon={
            iconAlign !== Alignment.RIGHT && iconName ? (
              <Icon color={iconColor} icon={iconName} />
            ) : null
          }
          isCompact={isCompact}
          key={id}
          labelElement={
            iconAlign === Alignment.RIGHT && iconName ? (
              <Icon color={iconColor} icon={iconName} />
            ) : null
          }
          onClick={() => onItemClicked(onClick, index)}
          text={label}
          textColor={textColor}
        />
      );
    });

    return (
      <StyledMenu backgroundColor={backgroundColor}>{listItems}</StyledMenu>
    );
  }
}

export interface PopoverTargetButtonProps {
  borderRadius?: string;
  boxShadow?: string;
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  iconName?: IconName;
  iconAlign?: Alignment;
  isDisabled?: boolean;
  label?: string;
  placement?: ButtonPlacement;
  renderMode?: RenderMode;
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
    placement,
    renderMode,
  } = props;

  const isRightAlign = iconAlign === Alignment.RIGHT;

  return (
    <DragContainer
      buttonColor={buttonColor}
      buttonVariant={buttonVariant}
      disabled={isDisabled}
      renderMode={renderMode}
    >
      <BaseButton
        alignText={getAlignText(isRightAlign, iconName)}
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        buttonColor={buttonColor}
        buttonVariant={buttonVariant}
        disabled={isDisabled}
        fill
        icon={!isRightAlign && iconName ? iconName : null}
        placement={placement}
        rightIcon={isRightAlign && iconName ? iconName : null}
        text={label}
      />
    </DragContainer>
  );
}

function MenuButtonComponent(props: MenuButtonComponentProps) {
  const {
    borderRadius,
    boxShadow,
    configureMenuItems,
    getVisibleItems,
    iconAlign,
    iconName,
    isCompact,
    isDisabled,
    label,
    menuColor,
    menuDropDownWidth,
    menuItems,
    menuItemsSource,
    menuVariant,
    onItemClicked,
    placement,
    renderMode,
    sourceData,
    widgetId,
    width,
  } = props;

  return (
    <>
      <PopoverStyles
        borderRadius={borderRadius}
        id={widgetId}
        menuDropDownWidth={menuDropDownWidth}
        parentWidth={width - WidgetContainerDiff}
      />
      <Popover2
        content={
          <PopoverContent
            backgroundColor={menuColor}
            borderRadius={borderRadius}
            configureMenuItems={configureMenuItems}
            getVisibleItems={getVisibleItems}
            isCompact={isCompact}
            menuItems={menuItems}
            menuItemsSource={menuItemsSource}
            onItemClicked={onItemClicked}
            sourceData={sourceData}
          />
        }
        disabled={isDisabled}
        fill
        minimal
        placement="bottom-end"
        popoverClassName={`menu-button-popover menu-button-width-${widgetId}`}
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
          placement={placement}
          renderMode={renderMode}
        />
      </Popover2>
    </>
  );
}

export default MenuButtonComponent;
