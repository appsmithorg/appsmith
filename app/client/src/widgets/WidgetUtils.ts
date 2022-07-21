// import React, { JSXElementConstructor } from "react";
// import { IconProps, IconWrapper } from "constants/IconConstants";

import { Alignment } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import {
  CANVAS_SELECTOR,
  CONTAINER_GRID_PADDING,
  GridDefaults,
  TextSizes,
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
  ButtonBorderRadiusTypes,
} from "components/constants";
import tinycolor from "tinycolor2";
import { createGlobalStyle } from "styled-components";
import { Classes } from "@blueprintjs/core";
import { Classes as DateTimeClasses } from "@blueprintjs/datetime";
import { BoxShadowTypes } from "components/designSystems/appsmith/WidgetStyleContainer";
import { SchemaItem } from "./JSONFormWidget/constants";
import { find, isEmpty } from "lodash";
import { rgbaMigrationConstantV56 } from "./constants";
import { DynamicPath } from "utils/DynamicBindingUtils";
import { isArray } from "lodash";
import { PropertyHookUpdates } from "constants/PropertyControlConstants";

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
  backgroundColor = backgroundColor ? backgroundColor : "#fff";

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
        ? darkenColor(backgroundColor, 10)
        : theme.colors.button.primary.primary.hoverColor;
  }
};

export const getCustomBackgroundColor = (
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  return buttonVariant === ButtonVariantTypes.PRIMARY
    ? backgroundColor
      ? backgroundColor
      : "#fff"
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
export const getComplementaryGrayscaleColor = (color = "#fff") => {
  const tinyColor = tinycolor(color);
  const rgb: any = tinyColor.isValid()
    ? tinyColor.toRgb()
    : tinycolor("#fff").toRgb();

  const brightness = Math.round(
    (parseInt(rgb.r) * 299 + parseInt(rgb.g) * 587 + parseInt(rgb.b) * 114) /
      1000,
  );
  const textColor = brightness > 125 ? "black" : "white";

  return textColor;
};

/**
 * lightens the color
 *
 * @param borderRadius
 * @returns
 */
export const lightenColor = (color = "#fff") => {
  const { h, s } = tinycolor(color).toHsl();

  const newColor = tinycolor(`hsl ${h} ${s} 0.93}`).toHex();

  return `#${newColor}`;
};

/**
 * darken the color
 *
 * @param borderRadius
 * @returns
 */
export const darkenColor = (color = "#fff", amount = 10) => {
  const tinyColor = tinycolor(color);

  return tinyColor.isValid()
    ? tinyColor.darken(amount).toString()
    : tinycolor("#fff")
        .darken(amount)
        .toString();
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
  accentColor: string;
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
      background-color: ${props.accentColor} !important;
    }

    .${props.portalClassName}  .${Classes.INPUT} {
      border-radius: ${props.borderRadius} !important;
    }

    .${props.portalClassName}  .${Classes.INPUT}:focus, .${
    props.portalClassName
  }  .${Classes.INPUT}:active {
      border: 1px solid ${props.accentColor} !important;
      box-shadow:  0px 0px 0px 2px ${lightenColor(
        props.accentColor,
      )} !important;
    }

    .${props.portalClassName} .ads-dropdown-options-wrapper {
      border: 0px solid !important;
    }
  `}
`;

/**
 * Maps the old font sizes such as HEADING1, HEADING2 etc. to the new theming fontSizes(in rems).
 * This is specifically added for the theming migration. For text-widget v2 this function should be removed.
 * @param fontSize
 * @returns
 */
export const fontSizeUtility = (fontSize: string | undefined) => {
  switch (fontSize) {
    case TextSizes.PARAGRAPH2:
      return "0.75rem";
    case TextSizes.PARAGRAPH:
      return "0.875rem";
    case TextSizes.HEADING3:
      return "1rem";
    case TextSizes.HEADING2:
      return "1.125rem";
    case TextSizes.HEADING1:
      return "1.5rem";

    default:
      return fontSize;
  }
};

/**
 * Function to map Old borderRadius(with dynamic binding) to the new theming border radius in theming migration.
 * This function should be removed from the widgets whenever their is a new version release for the widgets.
 * @param borderRadius
 * @returns
 */
export const borderRadiusUtility = (borderRadius: string | undefined) => {
  switch (borderRadius) {
    case ButtonBorderRadiusTypes.SHARP:
      return "0px";
    case ButtonBorderRadiusTypes.ROUNDED:
      return "0.375rem";
    case ButtonBorderRadiusTypes.CIRCLE:
      return "9999px";
    default:
      return borderRadius;
  }
};

/**
 * Function used inside boxShadowMigration to replace the default rgba(0, 0, 0, 0.25) value with the computed boxShadowColor theming migration for table widget.
 * @param boxShadow
 * @param boxShadowColor
 * @returns
 */
export const replaceRgbaMigrationConstant = (
  boxShadow: string,
  boxShadowColor: string,
) => {
  if (boxShadowColor) {
    return boxShadow.replace("rgba(0, 0, 0, 0.25)", boxShadowColor);
  }
  return boxShadow;
};

/**
 * Function used inside boxShadowMigration to map dynamicBinding based boxShadow to its respective mappings in theming migration for table widget.
 * @param boxShadow
 * @param boxShadowColor
 * @returns
 */
export const boxShadowUtility = (boxShadow: string, boxShadowColor: string) => {
  const newBoxShadowColor = boxShadowColor || rgbaMigrationConstantV56;
  switch (boxShadow) {
    case BoxShadowTypes.VARIANT1:
      return `0px 0px 4px 3px ${newBoxShadowColor}`;
    case BoxShadowTypes.VARIANT2:
      return `3px 3px 4px ${newBoxShadowColor}`;
    case BoxShadowTypes.VARIANT3:
      return `0px 1px 3px ${newBoxShadowColor}`;
    case BoxShadowTypes.VARIANT4:
      return `2px 2px 0px  ${newBoxShadowColor}`;
    case BoxShadowTypes.VARIANT5:
      return `-2px -2px 0px ${newBoxShadowColor}`;
  }
};

/**
 * Function used inside table widget cell properties for Icon and menu button types that helps to migrate boxShadow and boxShadowColor for the table widget.
 * This function is used to run post theming migration for boxShadow and boxShadowColor;
 * Function runs for the following scenarios, when:
 * 1. boxShadow: Static; boxShadowColor: Dynamic
 * 2. boxShadow: Dynamic; boxShadowColor: Static
 * 3. boxShadow: Dynamic; boxShadowColor: empty
 * 4. boxShadow: Dynamic; boxShadowColor: dynamic
 *
 * based on the above condition we apply the boxShadowUtility and boxShadowColorUtility functions.
 *
 * @param child Widget props
 * @param columnName Current column name
 * @param boxShadow current box shadow
 * @param boxShadowColor current box shadow color
 * @returns
 */
export const boxShadowMigration = (
  dynamicList: DynamicPath[],
  columnName: string,
  boxShadow: string,
  boxShadowColor: any,
) => {
  const boxShadowRegex = new RegExp(columnName + ".boxShadow$");
  const boxShadowColorRegex = new RegExp(columnName + ".boxShadowColor$");

  const isBoxShadowDynamic = find(dynamicList, (value) =>
    boxShadowRegex.test(value.key),
  );
  const isBoxShadowColorDynamic = find(dynamicList, (value) =>
    boxShadowColorRegex.test(value.key),
  );

  //Case:1
  if (!isBoxShadowDynamic && isBoxShadowColorDynamic) {
    return replaceRgbaMigrationConstant(boxShadow, boxShadowColor);
  } else if (
    //Case 2 & 3:
    isBoxShadowDynamic &&
    (!isBoxShadowColorDynamic || boxShadowColor === "")
  ) {
    return boxShadowUtility(boxShadow, boxShadowColor);
  } else if (
    //Case 4:
    isBoxShadowDynamic &&
    isBoxShadowColorDynamic
  ) {
    const constantBoxShadow = boxShadowUtility(boxShadow, "");
    return replaceRgbaMigrationConstant(
      constantBoxShadow as string,
      boxShadowColor,
    );
  }
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

/**
 * Recursive function to traverse through all the children of the JSON form in theming migration.
 * @param schemaItem
 * @param propertyPath
 * @param callback
 */
export const parseSchemaItem = (
  schemaItem: SchemaItem,
  propertyPath: string,
  callback: (schemaItem: SchemaItem, propertyPath: string) => void,
) => {
  // Update the theme stuff for this schema
  callback(schemaItem, propertyPath);
  if (schemaItem && !isEmpty(schemaItem.children)) {
    Object.values(schemaItem.children).forEach((schemaItem) => {
      const childPropertyPath = `${propertyPath}.children.${schemaItem.identifier}`;
      parseSchemaItem(schemaItem, childPropertyPath, callback);
    });
  }
};

export const getMainCanvas = () =>
  document.querySelector(`.${CANVAS_SELECTOR}`) as HTMLElement;

/*
 * Function that composes two or more hooks together in the updateHook
 * property of the property pane config
 *
 * - Often times we would wanna call more than one hook when a property is
 *   changed. Use this hook instead of nested calls
 *
 * Eack hook should either return `undefined` or an array of PropertyHookUpdates
 * this function ignores the undefined and concats all the property update array.
 */
export function composePropertyUpdateHook(
  updateFunctions: Array<
    (
      props: any,
      propertyPath: string,
      propertyValue: any,
    ) => Array<PropertyHookUpdates> | undefined
  >,
): (
  props: any,
  propertyPath: string,
  propertyValue: any,
) => Array<PropertyHookUpdates> | undefined {
  return (props: any, propertyPath: string, propertyValue: any) => {
    if (updateFunctions.length) {
      let updates: PropertyHookUpdates[] = [];

      updateFunctions.forEach((func) => {
        if (typeof func === "function") {
          const value = func(props, propertyPath, propertyValue);

          if (isArray(value)) {
            updates = updates.concat(value);
          }
        }
      });

      return updates.length ? updates : undefined;
    } else {
      return undefined;
    }
  };
}
