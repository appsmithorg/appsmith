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

const punycode = require("punycode/");

type SanitizeOptions = {
  existingKeys?: string[];
};

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
// Padding between PositionContainer and Widget
export const WidgetContainerDiff = 8;
// MArgin between Label and Input
export const labelMargin = 5;
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
    return theme.colors.button[ButtonStyleTypes.PRIMARY.toLowerCase()].primary
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

// Creates a map between the string part of a key with max suffixed number found
// eg. keys -> ["key1", "key10", "newKey"]
// returns -> {key: 10, newKey: 0 }
const generateKeyToIndexMap = (keys: string[]) => {
  const map: Record<string, number> = {};

  keys.forEach((key) => {
    /**
     * input key123
     * -> ['123', index: 3, input: 'key123', groups: undefined] (match return value)
     *
     * input key
     * -> null
     */
    const match = key.match(/\d+$/);
    let prefix = key;
    let suffix = 0;
    const isKeyPresentInMap = map.hasOwnProperty(prefix);

    if (match) {
      prefix = key.slice(0, match.index); // key123 -> key
      suffix = parseInt(match[0], 10);
    }

    if (!isKeyPresentInMap || (isKeyPresentInMap && map[key] < suffix)) {
      map[prefix] = suffix;
    }
  });

  return map;
};

export const sanitizeKey = (key: string, options?: SanitizeOptions) => {
  // Step1 convert to ASCII characters
  let sanitizedKey = punycode.toASCII(key);

  // Step 2 Replaces all spl. characters/spaces with _
  sanitizedKey = sanitizedKey.replace(/[^\w]/gi, "_");

  // Step 3 Check if empty key
  if (sanitizedKey.length === 0) sanitizedKey = "_";

  // Step 4 Check if key starts with number
  const [firstCharacter] = sanitizedKey;
  if (/\d/.test(firstCharacter)) sanitizedKey = `_${sanitizedKey}`;

  // Step 5 handle checking with existing keys if present
  const { existingKeys = [] } = options || {};
  if (existingKeys.length) {
    const exactMatch = existingKeys.includes(sanitizedKey);

    if (!exactMatch) return sanitizedKey;

    const keyToIndexMap = generateKeyToIndexMap(existingKeys);

    const match = sanitizedKey.match(/\d+$/);
    let prefix = sanitizedKey;

    if (match) {
      prefix = sanitizedKey.slice(0, match.index); // key123 -> key
    }

    if (keyToIndexMap.hasOwnProperty(prefix)) {
      return `${prefix}${keyToIndexMap[prefix] + 1}`;
    }

    return sanitizedKey;
  }

  return sanitizedKey;
};

export const isSameOrigin = (url1: string, url2: string) => {
  try {
    const tempUrl1 = new URL(url1);
    const tempUrl2 = new URL(url2);
    return (
      tempUrl1.protocol === tempUrl2.protocol &&
      tempUrl1.hostname === tempUrl2.hostname &&
      tempUrl1.port === tempUrl2.port
    );
  } catch (err) {
    return false;
  }
};
