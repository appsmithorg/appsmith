// import React, { JSXElementConstructor } from "react";
// import { IconProps, IconWrapper } from "constants/IconConstants";

import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import generate from "nanoid/generate";
import { WidgetPositionProps } from "./BaseWidget";
import { Theme } from "constants/DefaultTheme";
import {
  ButtonBorderRadius,
  ButtonBorderRadiusTypes,
  ButtonBoxShadow,
  ButtonBoxShadowTypes,
  ButtonStyleTypes,
  ButtonVariant,
  ButtonVariantTypes,
} from "components/constants";
import tinycolor from "tinycolor2";
import { Colors } from "constants/Colors";

export function getDisplayName(WrappedComponent: {
  displayName: any;
  name: any;
}) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}

export function getWidgetDimensions(props: WidgetPositionProps) {
  return {
    componentWidth:
      (props.rightColumn - props.leftColumn) * props.parentColumnSpace,
    componentHeight: (props.bottomRow - props.topRow) * props.parentRowSpace,
  };
}

export function getSnapSpaces(props: WidgetPositionProps) {
  const { componentWidth } = getWidgetDimensions(props);
  return {
    snapRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
    snapColumnSpace: componentWidth
      ? (componentWidth - (CONTAINER_GRID_PADDING + WIDGET_PADDING) * 2) /
        GridDefaults.DEFAULT_GRID_COLUMNS
      : 0,
  };
}

export const hexToRgb = (
  hex: string,
): {
  r: number;
  g: number;
  b: number;
} => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : {
        r: -1,
        g: -1,
        b: -1,
      };
};

export const hexToRgba = (color: string, alpha: number) => {
  const value = hexToRgb(color);
  return `rgba(${value.r}, ${value.g}, ${value.b}, ${alpha});`;
};

const ALPHANUMERIC = "1234567890abcdefghijklmnopqrstuvwxyz";
// const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export const generateReactKey = ({
  prefix = "",
}: { prefix?: string } = {}): string => {
  return prefix + generate(ALPHANUMERIC, 10);
};

export const getCustomTextColor = (theme: Theme, backgroundColor?: string) => {
  const brightness = tinycolor(backgroundColor)
    .greyscale()
    .getBrightness();
  const percentageBrightness = (brightness / 255) * 100;

  if (!backgroundColor)
    return theme.colors.button[ButtonStyleTypes.PRIMARY.toLowerCase()].primary
      .textColor;
  const isDark = percentageBrightness < 70;
  if (isDark) {
    return theme.colors.button.custom.solid.light.textColor;
  }
  return theme.colors.button.custom.solid.dark.textColor;
};

export const getCustomHoverColor = (
  theme: Theme,
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  if (!backgroundColor) {
    return theme.colors.button[ButtonStyleTypes.PRIMARY.toLowerCase()][
      (buttonVariant || ButtonVariantTypes.PRIMARY).toLowerCase()
    ].hoverColor;
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

export const getCustomBackgroundColor = (
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  return buttonVariant === ButtonVariantTypes.PRIMARY
    ? backgroundColor
    : "none";
};

export const getCustomBorderColor = (
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  return buttonVariant === ButtonVariantTypes.SECONDARY
    ? backgroundColor
    : "none";
};

/**
 * maps border radius names to actual value
 *
 * @param borderRadius
 * @returns
 */
export const getBorderRadiusValue = (
  borderRadius: ButtonBorderRadius | number | undefined,
) => {
  switch (borderRadius) {
    case ButtonBorderRadiusTypes.CIRCLE:
      return "17px";
    case ButtonBorderRadiusTypes.ROUNDED:
      return "5px";
    case ButtonBorderRadiusTypes.SHARP:
      return 0;
    default:
      return `${borderRadius}px`;
  }
};

/**
 * maps box shadow names to actual box shadow css value
 *
 * @param borderRadius
 * @returns
 */
export const getBoxShadowValue = (
  boxShadowColor: string | undefined,
  boxShadow: ButtonBoxShadow | undefined,
) => {
  switch (boxShadow) {
    case ButtonBoxShadowTypes.VARIANT1:
      return `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`;
    case ButtonBoxShadowTypes.VARIANT2:
      return `3px 3px 4px ${boxShadowColor ||
        Colors.BOX_SHADOW_DEFAULT_VARIANT2}`;
    case ButtonBoxShadowTypes.VARIANT3:
      return `0px 1px 3px ${boxShadowColor ||
        Colors.BOX_SHADOW_DEFAULT_VARIANT3}`;
    case ButtonBoxShadowTypes.VARIANT4:
      return `2px 2px 0px ${boxShadowColor ||
        Colors.BOX_SHADOW_DEFAULT_VARIANT4}`;
    case ButtonBoxShadowTypes.VARIANT5:
      return `2px -2px 0px  ${boxShadowColor ||
        Colors.BOX_SHADOW_DEFAULT_VARIANT5}`;
    default:
      return "0px 0px 0px transparent";
  }
};
