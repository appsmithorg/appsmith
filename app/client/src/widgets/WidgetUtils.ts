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
  ButtonStyleTypes,
  ButtonVariant,
  ButtonVariantTypes,
} from "components/constants";
import tinycolor from "tinycolor2";

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
  if (!backgroundColor)
    return theme.colors.button[ButtonStyleTypes.PRIMARY.toLowerCase()].solid
      .textColor;
  const isDark = tinycolor(backgroundColor).isDark();
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
        : theme.colors.button.primary.outline.hoverColor;

    case ButtonVariantTypes.TERTIARY:
      return backgroundColor
        ? tinycolor(backgroundColor)
            .lighten(40)
            .toString()
        : theme.colors.button.primary.ghost.hoverColor;

    default:
      return backgroundColor
        ? tinycolor(backgroundColor)
            .darken(10)
            .toString()
        : theme.colors.button.primary.solid.hoverColor;
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
