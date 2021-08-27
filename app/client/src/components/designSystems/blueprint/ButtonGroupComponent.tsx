import React from "react";
import { Alignment } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
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
import styled from "styled-components";
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

interface ButtonStyleProps {
  isHorizontal: boolean;
  buttonVariant?: ButtonVariant; // solid | outline | ghost
  buttonStyle?: ButtonStyle; // primary | warning ...
  isDisabled?: boolean;
}

const StyledButton = styled.div<ThemeProp & ButtonStyleProps>`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;

  ${({ buttonStyle, buttonVariant, theme }) => `
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
          : theme.colors.button.primary.solid.bgColor
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
            ? theme.colors.button.secondary.outline.hoverColor
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

    &:disabled {
      background-color: ${theme.colors.button.disabled.bgColor} !important;
      color: ${theme.colors.button.disabled.textColor} !important;
    }

    border: ${
      buttonVariant === ButtonVariantTypes.OUTLINE ||
      buttonVariant === ButtonVariantTypes.SOLID
        ? buttonStyle === ButtonStyleTypes.WARNING
          ? `1px solid ${theme.colors.button.warning.outline.borderColor}`
          : buttonStyle === ButtonStyleTypes.DANGER
          ? `1px solid ${theme.colors.button.danger.outline.borderColor}`
          : buttonStyle === ButtonStyleTypes.INFO
          ? `1px solid ${theme.colors.button.info.outline.borderColor}`
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? `0.5px solid ${Colors.ALTO2}`
          : `1px solid ${theme.colors.button.primary.outline.borderColor}`
        : "none"
    } !important;

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
  `}
`;

class ButtonGroupComponent extends React.Component<ButtonGroupComponentProps> {
  render() {
    const { groupButtons, orientation } = this.props;
    const isHorizontal = orientation === "horizontal";

    const items = Object.keys(groupButtons)
      .map((itemKey) => groupButtons[itemKey])
      .filter((item) => item.isVisible === true);

    return (
      <ButtonGroupWrapper
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        boxShadowColor={this.props.boxShadowColor}
        isHorizontal={isHorizontal}
      >
        {items.map((button) => {
          return (
            <StyledButton
              buttonStyle={button.buttonStyle}
              buttonVariant={button.buttonVariant}
              isHorizontal={isHorizontal}
              key={button.id}
            >
              {button.label}
            </StyledButton>
          );
        })}
      </ButtonGroupWrapper>
    );
  }
}

export interface ButtonGroupComponentProps extends ComponentProps {
  orientation: string;
  isDisabled: boolean;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  groupButtons: Record<
    string,
    {
      widgetId: string;
      id: string;
      index: number;
      isVisible?: boolean;
      isDisabled?: boolean;
      label?: string;
      buttonStyle?: ButtonStyle;
      buttonVariant: ButtonVariant;
      iconName?: IconName;
      iconAlign?: Alignment;
      onClick?: string;
    }
  >;
}

export default ButtonGroupComponent;
