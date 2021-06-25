import * as React from "react";
import styled from "styled-components";
import { Alignment, Button, Icon, Menu, MenuItem } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import { IconName } from "@blueprintjs/icons";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { darkenActive, darkenHover } from "constants/DefaultTheme";

export interface MenuContainerProps {
  isCompact?: boolean;
}

export const MenuContainer = styled.div<MenuContainerProps>`
  width: 100%;
  height: 100%;
  text-align: center;

  & > .bp3-popover2-target {
    height: 100%;
    display: ${({ isCompact }) => (isCompact ? "inline-block" : "block")};
  }
`;

export interface BaseStyleProps {
  backgroundColor?: string;
  textColor?: string;
}

const BaseButton = styled(Button)<BaseStyleProps>`
  height: 100%;
  overflow: hidden;
  ${({ backgroundColor }) =>
    backgroundColor &&
    `
      background-image: none !important;
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
}

function PopoverContent(props: PopoverContentProps) {
  const { menuItems: itemsObj, onItemClicked } = props;

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
        key={id}
        onClick={() => onItemClicked(onClick)}
        text={label}
        textColor={textColor}
      />
    );
  });

  return <Menu>{listItems}</Menu>;
}

function ButtonNormal(props: PopoverTargetButtonProps) {
  const {
    backgroundColor,
    iconAlign,
    iconColor,
    iconName,
    label,
    textColor,
  } = props;

  if (iconAlign === Alignment.RIGHT) {
    return (
      <BaseButton
        alignText={iconName ? Alignment.LEFT : Alignment.CENTER}
        backgroundColor={backgroundColor}
        fill
        rightIcon={<Icon color={iconColor} icon={iconName} />}
        text={label}
        textColor={textColor}
      />
    );
  }

  return (
    <BaseButton
      alignText={iconName ? Alignment.RIGHT : Alignment.CENTER}
      backgroundColor={backgroundColor}
      fill
      icon={<Icon color={iconColor} icon={iconName} />}
      text={label}
      textColor={textColor}
    />
  );
}

function ButtonMinimal(props: PopoverTargetButtonProps) {
  const { backgroundColor, iconColor, iconName } = props;

  return (
    <BaseButton
      backgroundColor={backgroundColor}
      icon={<Icon color={iconColor} icon={iconName} />}
    />
  );
}

export interface PopoverTargetButtonProps {
  isCompact?: boolean;
  label?: string;
  backgroundColor?: string;
  textColor?: string;
  iconName?: IconName;
  iconColor?: string;
  iconAlign?: Alignment;
}

function PopoverTargetButton(props: PopoverTargetButtonProps) {
  const {
    backgroundColor,
    iconAlign,
    iconColor,
    iconName,
    isCompact,
    label,
    textColor,
  } = props;

  if (isCompact) {
    return (
      <ButtonMinimal
        backgroundColor={backgroundColor}
        iconColor={iconColor}
        iconName={iconName}
        textColor={textColor}
      />
    );
  }

  return (
    <ButtonNormal
      backgroundColor={backgroundColor}
      iconAlign={iconAlign}
      iconColor={iconColor}
      iconName={iconName}
      label={label}
      textColor={textColor}
    />
  );
}

export interface MenuComponentProps extends ComponentProps {
  label?: string;
  textColor?: string;
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
  iconName?: IconName;
  iconColor?: string;
  iconAlign?: Alignment;
  onItemClicked: (onClick: string | undefined) => void;
}

function MenuComponent(props: MenuComponentProps) {
  const { isCompact, isDisabled, menuItems, onItemClicked } = props;

  return (
    <MenuContainer isCompact={isCompact}>
      <Popover2
        content={
          <PopoverContent menuItems={menuItems} onItemClicked={onItemClicked} />
        }
        disabled={isDisabled}
        fill
        minimal
        placement="bottom-end"
      >
        <PopoverTargetButton {...props} />
      </Popover2>
    </MenuContainer>
  );
}

export default MenuComponent;
