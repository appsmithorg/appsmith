// import React, { JSXElementConstructor } from "react";
// import { IconProps, IconWrapper } from "constants/IconConstants";

import { Alignment } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
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
  ButtonPlacement,
  ButtonPlacementTypes,
} from "components/constants";
import tinycolor from "tinycolor2";
import { createGlobalStyle } from "styled-components";
import { Classes } from "@blueprintjs/core";
import { Classes as DateTimeClasses } from "@blueprintjs/datetime";

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
// Padding between PostionContainer and Widget
export const WidgetContainerDiff = 8;
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
    return "#FFFFFF";
  }
  return "#000000";
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
        ? lightenColor(backgroundColor)
        : theme.colors.button.primary.secondary.hoverColor;

    case ButtonVariantTypes.TERTIARY:
      return backgroundColor
        ? lightenColor(backgroundColor)
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

export const getCustomJustifyContent = (placement?: ButtonPlacement) => {
  switch (placement) {
    case ButtonPlacementTypes.START:
      return "start";
    case ButtonPlacementTypes.CENTER:
      return "center";
    case ButtonPlacementTypes.BETWEEN:
      return "space-between";
    default:
      return "";
  }
};

export const getAlignText = (isRightAlign: boolean, iconName?: IconName) =>
  iconName
    ? isRightAlign
      ? Alignment.LEFT
      : Alignment.RIGHT
    : Alignment.CENTER;
export const escapeSpecialChars = (stringifiedJSONObject: string) => {
  return stringifiedJSONObject
    .replace(/\\n/g, "\\\\n") // new line char
    .replace(/\\b/g, "\\\\b") //
    .replace(/\\t/g, "\\\\t") // tab
    .replace(/\\f/g, "\\\\f") //
    .replace(/\\/g, "\\\\") //
    .replace(/\\r/g, "\\\\r"); //
};

/**
 * ---------------------------------------------------------------------------------------------------
 * STYLING UTILS
 *----------------------------------------------------------------------------------------------------
 *
 * this section contains all the helpers required related to styling of widget
 * by styling, we meant things like background color, text color, border-radius etc
 *
 */

/**
 * return "#fff" or "#000" based on the color passed
 * if the color is dark, it will return "#fff"
 * else it will return "#000"
 *
 * @param borderRadius
 * @returns
 */
export const getComplementaryGrayscaleColor = (color = "#fff", alpha = 1) => {
  const brightness = tinycolor(color)
    .greyscale()
    .getBrightness();
  const percentageBrightness = (brightness / 255) * 100;
  const isDark = percentageBrightness < 70;

  if (isDark)
    return tinycolor("#fff")
      .setAlpha(alpha)
      .toHexString();

  return tinycolor("#000")
    .setAlpha(alpha)
    .toHexString();
};

/**
 * lightens the color by given amount
 *
 * @param borderRadius
 * @returns
 */
export const lightenColor = (color = "#fff") => {
  const tinyAccentColor = tinycolor(color);
  const brightness = tinycolor(color)
    .greyscale()
    .getBrightness();

  const percentageBrightness = (brightness / 255) * 100;
  let nextBrightness = 0;

  switch (true) {
    case percentageBrightness > 70:
      nextBrightness = 15;
      break;
    case percentageBrightness > 60:
      nextBrightness = 25;
      break;
    case percentageBrightness > 50:
      nextBrightness = 35;
      break;
    case percentageBrightness > 40:
      nextBrightness = 45;
      break;
    default:
      nextBrightness = 65;
  }

  if (brightness > 180) {
    return tinyAccentColor.darken(10).toString();
  } else {
    return tinyAccentColor.lighten(nextBrightness).toString();
  }
};

/**
 * checks if color is dark or not
 *
 * @param color
 * @returns
 */
export const isDark = (color: string) => {
  const brightness = tinycolor(color)
    .greyscale()
    .getBrightness();
  const percentageBrightness = (brightness / 255) * 100;
  const isDark = percentageBrightness < 70;

  return isDark;
};

export const PopoverStyles = createGlobalStyle<{
  borderRadius: string;
  portalClassName: string;
  primaryColor: string;
}>`
  ${(props) => `
    .${props.portalClassName} .${Classes.POPOVER} {
      border-radius: ${props.borderRadius} !important;
      overflow: hidden;
      box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
      margin-top: 4px !important;
    }

    .${props.portalClassName} .${DateTimeClasses.DATEPICKER_DAY},
    .${props.portalClassName} .${Classes.BUTTON} {
      border-radius: ${props.borderRadius} !important;
    }
    .${props.portalClassName} .${DateTimeClasses.DATEPICKER_DAY_SELECTED} {
      background-color: ${props.primaryColor} !important;
    }

    .${props.portalClassName}  .${Classes.INPUT} {
      border-radius: ${props.borderRadius} !important;
    }

    .${props.portalClassName}  .${Classes.INPUT}:focus, .${
    props.portalClassName
  }  .${Classes.INPUT}:active {
      border: 1px solid ${props.primaryColor} !important;
      box-shadow:  0px 0px 0px 2px ${lightenColor(
        props.primaryColor,
      )} !important;
    }

    .${props.portalClassName} .ads-dropdown-options-wrapper {
      border: 0px solid !important;
    }
  `}
`;
