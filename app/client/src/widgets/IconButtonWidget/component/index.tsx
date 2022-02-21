import React, { useMemo } from "react";
import styled from "styled-components";
import { Button } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";

import { ComponentProps } from "widgets/BaseComponent";
import { ThemeProp } from "components/ads/common";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import _ from "lodash";
import {
  ButtonBorderRadius,
  ButtonBorderRadiusTypes,
  ButtonBoxShadow,
  ButtonBoxShadowTypes,
  ButtonVariant,
  ButtonVariantTypes,
} from "components/constants";
import {
  getCustomBackgroundColor,
  getCustomBorderColor,
  getCustomHoverColor,
  getCustomTextColor,
} from "widgets/WidgetUtils";

type IconButtonContainerProps = {
  disabled?: boolean;
};

const IconButtonContainer = styled.div<IconButtonContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  ${({ disabled }) => disabled && "cursor: not-allowed;"}
`;

export interface ButtonStyleProps {
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  buttonColor: string;
  buttonVariant?: ButtonVariant;
  dimension?: number;
  hasOnClickAction?: boolean;
}

export const StyledButton = styled((props) => (
  <Button
    {..._.omit(props, [
      "buttonVariant",
      "buttonStyle",
      "borderRadius",
      "boxShadow",
      "boxShadowColor",
      "dimension",
      "hasOnClickAction",
    ])}
  />
))<ThemeProp & ButtonStyleProps>`
  background-image: none !important;
  height: ${({ dimension }) => (dimension ? `${dimension}px` : "auto")};
  width: ${({ dimension }) => (dimension ? `${dimension}px` : "auto")};
  ${({ buttonColor, buttonVariant, hasOnClickAction, theme }) => `
    &:enabled {
      background: ${
        getCustomBackgroundColor(buttonVariant, buttonColor) !== "none"
          ? getCustomBackgroundColor(buttonVariant, buttonColor)
          : buttonVariant === ButtonVariantTypes.PRIMARY
          ? theme.colors.button.primary.primary.bgColor
          : "none"
      } !important;
    }

    ${
      hasOnClickAction
        ? `&:hover:enabled, &:active:enabled {
        background: ${
          getCustomHoverColor(theme, buttonVariant, buttonColor) !== "none"
            ? getCustomHoverColor(theme, buttonVariant, buttonColor)
            : buttonVariant === ButtonVariantTypes.SECONDARY
            ? theme.colors.button.primary.secondary.hoverColor
            : buttonVariant === ButtonVariantTypes.TERTIARY
            ? theme.colors.button.primary.tertiary.hoverColor
            : theme.colors.button.primary.primary.hoverColor
        } !important;
      }`
        : ""
    }

    &:disabled {
      background-color: ${theme.colors.button.disabled.bgColor} !important;
      color: ${theme.colors.button.disabled.textColor} !important;
      pointer-events: none;
    }

    &&:disabled {
      background-color: ${theme.colors.button.disabled.bgColor} !important;
      border-color: ${theme.colors.button.disabled.bgColor} !important;
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
      height: 100%;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;

      color: ${
        buttonVariant === ButtonVariantTypes.PRIMARY
          ? getCustomTextColor(theme, buttonColor)
          : getCustomBackgroundColor(
              ButtonVariantTypes.PRIMARY,
              buttonColor,
            ) !== "none"
          ? getCustomBackgroundColor(ButtonVariantTypes.PRIMARY, buttonColor)
          : `${theme.colors.button.primary.secondary.textColor}`
      } !important;
    }

    & > span > svg {
      height: 60%;
      width: 60%;
      min-height: 16px;
      min-width: 16px;
    }
  `}

  border-radius: ${({ borderRadius }) =>
    borderRadius === ButtonBorderRadiusTypes.CIRCLE
      ? "50%"
      : borderRadius === ButtonBorderRadiusTypes.ROUNDED
      ? "10px"
      : 0};

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

export interface IconButtonComponentProps extends ComponentProps {
  iconName?: IconName;
  buttonColor?: string;
  buttonVariant: ButtonVariant;
  borderRadius: ButtonBorderRadius;
  boxShadow: ButtonBoxShadow;
  boxShadowColor: string;
  isDisabled: boolean;
  isVisible: boolean;
  hasOnClickAction: boolean;
  onClick: () => void;
  height: number;
  width: number;
}

function IconButtonComponent(props: IconButtonComponentProps) {
  const {
    borderRadius,
    boxShadow,
    boxShadowColor,
    buttonColor,
    buttonVariant,
    hasOnClickAction,
    height,
    isDisabled,
    onClick,
    width,
  } = props;

  /**
   * returns the dimension to be used for widget
   * whatever is the minimum between width and height,
   * we will use that for the dimension of the widget
   */
  const dimension = useMemo(() => {
    if (width > height) {
      return height - WIDGET_PADDING * 2;
    }

    return width - WIDGET_PADDING * 2;
  }, [width, height]);

  return (
    <IconButtonContainer disabled={isDisabled}>
      <StyledButton
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        boxShadowColor={boxShadowColor}
        buttonColor={buttonColor}
        buttonVariant={buttonVariant}
        dimension={dimension}
        disabled={isDisabled}
        hasOnClickAction={hasOnClickAction}
        icon={props.iconName}
        large
        onClick={onClick}
      />
    </IconButtonContainer>
  );
}

export default IconButtonComponent;
