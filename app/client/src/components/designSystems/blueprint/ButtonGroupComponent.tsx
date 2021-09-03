import React from "react";
import { sortBy } from "lodash";
import { Alignment, Icon, Menu, MenuItem } from "@blueprintjs/core";
import { Classes, Popover2 } from "@blueprintjs/popover2";
import { IconName } from "@blueprintjs/icons";
import tinycolor from "tinycolor2";
import { darkenActive, darkenHover } from "constants/DefaultTheme";
import {
  ButtonBorderRadius,
  ButtonBorderRadiusTypes,
} from "components/propertyControls/ButtonBorderRadiusControl";
import {
  ButtonBoxShadow,
  ButtonBoxShadowTypes,
} from "components/propertyControls/BoxShadowOptionsControl";
import {
  ButtonStyle,
  ButtonStyleTypes,
  ButtonVariant,
  ButtonVariantTypes,
} from "constants/WidgetConstants";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { ThemeProp } from "components/ads/common";
import styled, { createGlobalStyle } from "styled-components";
import { Colors } from "constants/Colors";

interface WrapperStyleProps {
  isHorizontal: boolean;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
}

const ButtonGroupWrapper = styled.div<ThemeProp & WrapperStyleProps>`
  height: 100%;
  width: 100%;
  position: relative;
  display: flex;
  justify-content: stretch;
  align-items: stretch;
  overflow: hidden;
  ${(props) =>
    props.isHorizontal ? "flex-direction: row" : "flex-direction: column"};

  border-radius: ${({ borderRadius }) =>
    borderRadius === ButtonBorderRadiusTypes.ROUNDED
      ? "8px"
      : // : borderRadius === ButtonBorderRadiusTypes.CIRCLE
        // ? "10%"
        0};

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

const MenuButtonWrapper = styled.div`
  flex: 1 1 auto;

  & > .${Classes.POPOVER2_TARGET} {
    height: 100%;
  }
`;

const PopoverStyles = createGlobalStyle`
  .menu-button-popover > .${Classes.POPOVER2_CONTENT} {
    background: none;
  }
`;

interface ButtonStyleProps {
  isHorizontal: boolean;
  buttonVariant?: ButtonVariant; // solid | outline | ghost
  buttonStyle?: ButtonStyle; // primary | warning ...
  iconAlign?: string;
  isDisabled?: boolean;
}

export interface BaseStyleProps {
  backgroundColor?: string;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  buttonColor?: string;
  buttonStyle?: ButtonStyle;
  buttonVariant?: ButtonVariant;
  prevButtonStyle?: ButtonStyle;
  textColor?: string;
}

const StyledButton = styled.div<ThemeProp & ButtonStyleProps>`
  flex: 1 1 auto;
  display: flex;
  cursor: pointer;
  justify-content: space-evenly;
  align-items: center;
  flex-direction: ${({ iconAlign }) =>
    iconAlign === "right" ? "row-reverse" : "row"};

  ${({ buttonStyle, buttonVariant, isDisabled, theme }) => `
    & {
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
          ? Colors.WHITE
          : buttonVariant === ButtonVariantTypes.SOLID
          ? theme.colors.button.primary.solid.bgColor
          : "none"
      } !important;
    }

    &:hover {
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
            ? theme.colors.button.secondary.ghost.hoverColor
            : buttonVariant === ButtonVariantTypes.GHOST
            ? theme.colors.button.secondary.ghost.hoverColor
            : Colors.ALABASTER_ALT
          : buttonVariant === ButtonVariantTypes.OUTLINE
          ? theme.colors.button.primary.outline.hoverColor
          : buttonVariant === ButtonVariantTypes.GHOST
          ? theme.colors.button.primary.ghost.hoverColor
          : theme.colors.button.primary.solid.hoverColor
      } !important;
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
          ? `1px solid ${Colors.ALTO2}`
          : `1px solid ${theme.colors.button.primary.outline.borderColor}`
        : buttonVariant === ButtonVariantTypes.SOLID
        ? buttonStyle === ButtonStyleTypes.WARNING
          ? `0.5px solid ${theme.colors.button.warning.solid.hoverColor}`
          : buttonStyle === ButtonStyleTypes.DANGER
          ? `0.5px solid ${theme.colors.button.danger.solid.hoverColor}`
          : buttonStyle === ButtonStyleTypes.INFO
          ? `0.5px solid ${theme.colors.button.info.solid.hoverColor}`
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? `0.5px solid ${Colors.ALTO2}`
          : `0.5px solid ${theme.colors.button.primary.solid.hoverColor}`
        : "none"
    } !important;

    & span {
      color: ${
        buttonVariant === ButtonVariantTypes.SOLID
          ? buttonStyle === ButtonStyleTypes.SECONDARY
            ? `${Colors.CHARCOAL}`
            : `${Colors.WHITE}`
          : buttonStyle === ButtonStyleTypes.WARNING
          ? `${theme.colors.button.warning.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.DANGER
          ? `${theme.colors.button.danger.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.INFO
          ? `${theme.colors.button.info.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? `${Colors.CHARCOAL}`
          : `${theme.colors.button.primary.outline.textColor}`
      } !important;
    }

    ${isDisabled &&
      `
      & {
        pointer-events: none;
        border: 1px solid ${Colors.ALTO2} !important;
        background: ${Colors.ALABASTER_ALT} !important;
        span {
          color: ${Colors.ALTO2} !important;
        }
      }
    `}
  `}
`;

const BaseMenuItem = styled(MenuItem)<ThemeProp & BaseStyleProps>`
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
          theme.colors.button.primary.solid.textColor,
        )
          .darken()
          .toString()} !important;
      }
      &:active {
        background-color: ${tinycolor(
          theme.colors.button.primary.solid.textColor,
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
`;

const StyledMenu = styled(Menu)`
  padding: 0;
  background: none;
`;

interface PopoverContentProps {
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
  onItemClicked: (onClick: string | undefined) => () => void;
}

function PopoverContent(props: PopoverContentProps) {
  const { menuItems, onItemClicked } = props;

  const items = Object.keys(menuItems)
    .map((itemKey) => menuItems[itemKey])
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
          onClick={onItemClicked(onClick)}
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
        onClick={onItemClicked(onClick)}
        text={label}
        textColor={textColor}
      />
    );
  });

  return <StyledMenu>{listItems}</StyledMenu>;
}

class ButtonGroupComponent extends React.Component<ButtonGroupComponentProps> {
  onButtonClick = (onClick: string | undefined) => () => {
    this.props.buttonClickHandler(onClick);
  };

  renderMenuButton = (button: GroupButtonProps, isHorizontal: boolean) => {
    const { menuItems } = button;

    return (
      <MenuButtonWrapper>
        <PopoverStyles />
        <Popover2
          content={
            <PopoverContent
              menuItems={menuItems || {}}
              onItemClicked={this.onButtonClick}
            />
          }
          disabled={button.isDisabled}
          fill
          minimal
          placement="bottom-end"
          popoverClassName="menu-button-popover"
        >
          <StyledButton
            buttonStyle={button.buttonStyle}
            buttonVariant={button.buttonVariant}
            iconAlign={button.iconAlign}
            isDisabled={button.isDisabled}
            isHorizontal={isHorizontal}
            style={{ height: "100%", width: "100%" }}
          >
            {button.iconName && <Icon icon={button.iconName} />}
            {!!button.label && <span>{button.label}</span>}
          </StyledButton>
        </Popover2>
      </MenuButtonWrapper>
    );
  };

  render = () => {
    const { groupButtons, orientation } = this.props;
    const isHorizontal = orientation === "horizontal";

    let items = Object.keys(groupButtons)
      .map((itemKey) => groupButtons[itemKey])
      .filter((item) => item.isVisible === true);
    // sort btns by index
    items = sortBy(items, ["index"]);

    return (
      <ButtonGroupWrapper
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        boxShadowColor={this.props.boxShadowColor}
        isHorizontal={isHorizontal}
      >
        {items.map((button) => {
          if (button.buttonType === "MENU") {
            return this.renderMenuButton(button, isHorizontal);
          } else {
            return (
              <StyledButton
                buttonStyle={button.buttonStyle}
                buttonVariant={button.buttonVariant}
                iconAlign={button.iconAlign}
                isDisabled={button.isDisabled}
                isHorizontal={isHorizontal}
                key={button.id}
                onClick={this.onButtonClick(button.onClick)}
              >
                {button.iconName && <Icon icon={button.iconName} />}
                {!!button.label && <span>{button.label}</span>}
              </StyledButton>
            );
          }
        })}
      </ButtonGroupWrapper>
    );
  };
}

interface GroupButtonProps {
  widgetId: string;
  id: string;
  index: number;
  isVisible?: boolean;
  isDisabled?: boolean;
  label?: string;
  buttonType?: string;
  buttonStyle?: ButtonStyle;
  buttonVariant: ButtonVariant;
  iconName?: IconName;
  iconAlign?: Alignment;
  onClick?: string;
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
}

export interface ButtonGroupComponentProps extends ComponentProps {
  orientation: string;
  isDisabled: boolean;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  buttonClickHandler: (onClick: string | undefined) => void;
  groupButtons: Record<string, GroupButtonProps>;
}

export default ButtonGroupComponent;
