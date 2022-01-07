import React from "react";
import { sortBy } from "lodash";
import {
  Alignment,
  Icon,
  Menu,
  MenuItem,
  Classes as CoreClass,
} from "@blueprintjs/core";
import { Classes, Popover2 } from "@blueprintjs/popover2";
import { IconName } from "@blueprintjs/icons";
import tinycolor from "tinycolor2";
import { darkenActive, darkenHover } from "constants/DefaultTheme";
import {
  ButtonStyleType,
  ButtonVariant,
  ButtonVariantTypes,
  ButtonPlacement,
} from "components/constants";
import { ThemeProp } from "components/ads/common";
import styled, { createGlobalStyle } from "styled-components";
import { Colors } from "constants/Colors";
import {
  getCustomBackgroundColor,
  getCustomBorderColor,
  getCustomHoverColor,
  getCustomTextColor,
  getCustomJustifyContent,
} from "widgets/WidgetUtils";

interface WrapperStyleProps {
  isHorizontal: boolean;
  borderRadius?: string;
  boxShadow?: string;
}

const ButtonGroupWrapper = styled.div<ThemeProp & WrapperStyleProps>`
  height: 100%;
  width: 100%;
  position: relative;
  display: flex;
  justify-content: stretch;
  align-items: stretch;
  overflow: hidden;
  cursor: not-allowed;

  ${(props) =>
    props.isHorizontal ? "flex-direction: row" : "flex-direction: column"};
  box-shadow: ${({ boxShadow }) => boxShadow};
  border-radius: ${({ borderRadius }) => borderRadius};

  & > *:first-child,
  & > *:first-child button {
    border-radius: ${({ borderRadius, isHorizontal }) =>
      isHorizontal
        ? `${borderRadius} 0px 0px ${borderRadius}`
        : `${borderRadius} ${borderRadius} 0px 0px`};
  }

  & > *:last-child,
  & > *:last-child button {
    border-radius: ${({ borderRadius, isHorizontal }) =>
      isHorizontal
        ? `0px ${borderRadius} ${borderRadius} 0`
        : `0px 0px ${borderRadius} ${borderRadius}`};
  }
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
  borderRadius?: string;
  buttonVariant?: ButtonVariant; // solid | outline | ghost
  buttonColor?: string;
  iconAlign?: string;
  placement?: ButtonPlacement;
  isDisabled?: boolean;
}

const StyledButton = styled.button<ThemeProp & ButtonStyleProps>`
  flex: 1 1 auto;
  display: flex;
  cursor: pointer;
  justify-content: stretch;
  align-items: center;
  padding: 0px 10px;

  ${({ buttonColor, buttonVariant, iconAlign, isDisabled, theme }) => `
    & {
      background: ${
        getCustomBackgroundColor(buttonVariant, buttonColor) !== "none"
          ? getCustomBackgroundColor(buttonVariant, buttonColor)
          : buttonVariant === ButtonVariantTypes.PRIMARY
          ? theme.colors.button.primary.primary.bgColor
          : "none"
      } !important;
      flex-direction : ${iconAlign === "right" ? "row-reverse" : "row"};
      .bp3-icon {
        ${iconAlign === "right" ? "margin-left: 10px" : "margin-right: 10px"};
      }
    }

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

    border: ${
      getCustomBorderColor(buttonVariant, buttonColor) !== "none"
        ? `1px solid ${getCustomBorderColor(buttonVariant, buttonColor)}`
        : buttonVariant === ButtonVariantTypes.SECONDARY
        ? `1px solid ${theme.colors.button.primary.secondary.borderColor}`
        : "none"
    } ${buttonVariant === ButtonVariantTypes.PRIMARY ? "" : "!important"};

    & span {
      color: ${
        buttonVariant === ButtonVariantTypes.PRIMARY
          ? getCustomTextColor(theme, buttonColor)
          : getCustomBackgroundColor(ButtonVariantTypes.PRIMARY, buttonColor)
      } !important;
    }

    ${isDisabled &&
      `
      & {
        pointer-events: none;
        border: 1px solid ${Colors.ALTO2} !important;
        background: ${theme.colors.button.disabled.bgColor} !important;
        span {
          color: ${theme.colors.button.disabled.textColor} !important;
        }
      }
    `}
  `}
`;

const StyledButtonContent = styled.div<{
  iconAlign: string;
  placement?: ButtonPlacement;
}>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: ${({ placement }) => getCustomJustifyContent(placement)};
  flex-direction: ${({ iconAlign }) =>
    iconAlign === Alignment.RIGHT ? "row-reverse" : "row"};
  & .bp3-icon {
    ${({ iconAlign }) =>
      iconAlign === "right" ? "margin-left: 10px" : "margin-right: 10px"};
  }
`;

export interface BaseStyleProps {
  backgroundColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  buttonColor?: string;
  buttonStyle?: ButtonStyleType;
  buttonVariant?: ButtonVariant;
  textColor?: string;
}

const BaseMenuItem = styled(MenuItem)<ThemeProp & BaseStyleProps>`
  padding: 8px 10px !important;
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
`;

const StyledMenu = styled(Menu)`
  padding: 0;
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

  let items = Object.keys(menuItems)
    .map((itemKey) => menuItems[itemKey])
    .filter((item) => item.isVisible === true);
  // sort btns by index
  items = sortBy(items, ["index"]);

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

  render = () => {
    const { buttonVariant, groupButtons, isDisabled, orientation } = this.props;
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
        className="t--buttongroup-widget"
        isHorizontal={isHorizontal}
      >
        {items.map((button) => {
          const isButtonDisabled = button.isDisabled || isDisabled;

          if (button.buttonType === "MENU" && !isButtonDisabled) {
            const { menuItems } = button;

            return (
              <MenuButtonWrapper key={button.id}>
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
                    borderRadius={this.props.borderRadius}
                    buttonColor={button.buttonColor || this.props.primaryColor}
                    buttonVariant={buttonVariant}
                    iconAlign={button.iconAlign}
                    isDisabled={isButtonDisabled}
                    isHorizontal={isHorizontal}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <StyledButtonContent
                      iconAlign={button.iconAlign || "left"}
                      placement={button.placement}
                    >
                      {button.iconName && <Icon icon={button.iconName} />}
                      {!!button.label && (
                        <span className={CoreClass.BUTTON_TEXT}>
                          {button.label}
                        </span>
                      )}
                    </StyledButtonContent>
                  </StyledButton>
                </Popover2>
              </MenuButtonWrapper>
            );
          }
          return (
            <StyledButton
              borderRadius={this.props.borderRadius}
              buttonColor={button.buttonColor || this.props.primaryColor}
              buttonVariant={buttonVariant}
              iconAlign={button.iconAlign}
              isDisabled={isButtonDisabled}
              isHorizontal={isHorizontal}
              key={button.id}
              onClick={this.onButtonClick(button.onClick)}
            >
              <StyledButtonContent
                iconAlign={button.iconAlign || "left"}
                placement={button.placement}
              >
                {button.iconName && <Icon icon={button.iconName} />}
                {!!button.label && (
                  <span className={CoreClass.BUTTON_TEXT}>{button.label}</span>
                )}
              </StyledButtonContent>
            </StyledButton>
          );
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
  buttonColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  placement?: ButtonPlacement;
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

export interface ButtonGroupComponentProps {
  orientation: string;
  isDisabled: boolean;
  borderRadius?: string;
  boxShadow?: string;
  buttonVariant: ButtonVariant;
  buttonClickHandler: (onClick: string | undefined) => void;
  groupButtons: Record<string, GroupButtonProps>;
  primaryColor?: string;
}

export default ButtonGroupComponent;
