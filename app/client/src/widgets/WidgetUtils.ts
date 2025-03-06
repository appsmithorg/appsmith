import type React from "react";
import { Alignment, Classes } from "@blueprintjs/core";
import { Classes as DTClasses } from "@blueprintjs/datetime";
import type { IconName } from "@blueprintjs/icons";
import type { ButtonPlacement, ButtonVariant } from "components/constants";
import {
  ButtonBorderRadiusTypes,
  ButtonPlacementTypes,
  ButtonStyleTypes,
  ButtonVariantTypes,
} from "components/constants";
import { BoxShadowTypes } from "components/designSystems/appsmith/WidgetStyleContainer";
import type { Theme } from "constants/DefaultTheme";
import type { PropertyUpdates } from "WidgetProvider/constants";
import {
  CANVAS_SELECTOR,
  CONTAINER_GRID_PADDING,
  GridDefaults,
  TextSizes,
  WidgetHeightLimits,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { find, isArray, isEmpty } from "lodash";
import generate from "nanoid/generate";
import { createGlobalStyle, css } from "styled-components";
import tinycolor from "tinycolor2";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import { getLocale } from "utils/helpers";
import { DynamicHeight } from "utils/WidgetFeatures";
import type { WidgetPositionProps, WidgetProps } from "./BaseWidget";
import {
  COMPACT_MODE_MIN_ROWS,
  rgbaMigrationConstantV56,
} from "../WidgetProvider/constants";
import type { SchemaItem } from "./JSONFormWidget/constants";
import { WIDGET_COMPONENT_BOUNDARY_CLASS } from "constants/componentClassNameConstants";
import punycode from "punycode";
import type { FlattenedWidgetProps } from "ee/reducers/entityReducers/canvasWidgetsReducer";

interface SanitizeOptions {
  existingKeys?: string[];
}

const REACT_ELEMENT_PROPS = "__reactProps$";

export function getDisplayName(WrappedComponent: {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  displayName: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const DefaultAutocompleteDefinitions = {
  isVisible: {
    "!type": "bool",
    "!doc": "Boolean value indicating if the widget is in visible state",
  },
};

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

export const generateReactKey = ({
  prefix = "",
}: { prefix?: string } = {}): string => {
  return prefix + generate(ALPHANUMERIC, 10);
};

export const getCustomTextColor = (theme: Theme, backgroundColor?: string) => {
  const brightness = tinycolor(backgroundColor).greyscale().getBrightness();
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
        ? calculateHoverColor(backgroundColor, true)
        : theme.colors.button.primary.secondary.hoverColor;

    case ButtonVariantTypes.TERTIARY:
      return backgroundColor
        ? calculateHoverColor(backgroundColor, true)
        : theme.colors.button.primary.tertiary.hoverColor;

    default:
      return backgroundColor
        ? calculateHoverColor(backgroundColor, false)
        : theme.colors.button.primary.primary.hoverColor;
  }
};

/**
 * Calculate Hover Color using the logic
 * https://www.notion.so/appsmith/Widget-hover-colors-165e54b304ca4e83a355e4e14d7aa3cb
 *
 * In case of transparent backgrounds (secondary or tertiary button variants)
 * 1. Find out the button color
 * 2. Calculate hover color by setting the button color to 10% transparency
 * 3. Add the calculated color to the background of the button
 *
 * In case of non transparent backgrounds (primary button variant), using the HSL color modal,
 * 1. If lightness > 35, decrease the lightness by 5 on hover
 * 2. If lightness <= 35, increase the lightness by 5 on hover
 *
 * @param backgroundColor A color string
 * @param hasTransparentBackground Boolean to represent if the button has transparent background
 *
 * @returns An RGB string (in case of transparent backgrounds) or a HSL string (in case of solid backgrounds).
 */
export const calculateHoverColor = (
  backgroundColor: string,
  hasTransparentBackground?: boolean,
) => {
  // For transparent backgrounds
  if (hasTransparentBackground) {
    return tinycolor(backgroundColor).setAlpha(0.1).toRgbString();
  }

  // For non-transparent backgrounds, using the HSL color modal
  const backgroundColorHsl = tinycolor(backgroundColor).toHsl();

  // Check the lightness and modify accordingly
  if (backgroundColorHsl.l > 0.35) {
    backgroundColorHsl.l -= 0.05;
  } else {
    backgroundColorHsl.l += 0.05;
  }

  return tinycolor(backgroundColorHsl).toHslString();
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
  const textColor = isLightColor(color) ? "black" : "white";

  return textColor;
};

/**
 *  return true if the color is light
 *
 * @param color
 * @returns
 */
export const isLightColor = (color = "#fff") => {
  const tinyColor = tinycolor(color);
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rgb: any = tinyColor.isValid()
    ? tinyColor.toRgb()
    : tinycolor("#fff").toRgb();

  const brightness = Math.round(
    (parseInt(rgb.r) * 299 + parseInt(rgb.g) * 587 + parseInt(rgb.b) * 114) /
      1000,
  );

  return brightness > 125;
};

/**
 * lightens the color
 *
 * @param borderRadius
 * @returns
 */
export const lightenColor = (color = "#fff", amount = "0.93") => {
  const { h, s } = tinycolor(color).toHsl();

  const newColor = tinycolor(`hsl ${h} ${s} ${amount}}`).toHex();

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
    : tinycolor("#fff").darken(amount).toString();
};

export const getRgbaColor = (color: string, opacity: number) => {
  const { b, g, r } = tinycolor(color).toRgb();

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * checks if color is dark or not
 *
 * @param color
 * @returns
 */
export const isDark = (color: string) => {
  const brightness = tinycolor(color).greyscale().getBrightness();
  const percentageBrightness = (brightness / 255) * 100;
  const isDark = percentageBrightness < 70;

  return isDark;
};

export const PopoverStyles = createGlobalStyle<{
  borderRadius: string;
  portalClassName: string;
  accentColor: string;
}>`
  ${({ accentColor, borderRadius, portalClassName }) => `
    .${portalClassName} .${Classes.POPOVER} {
      border-radius: ${borderRadius} !important;
      overflow: hidden;
      box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
      margin-top: 4px !important;
    }

    .${portalClassName} .${DTClasses.DATEPICKER_DAY},
    .${portalClassName} .${Classes.BUTTON} {
      border-radius: ${borderRadius} !important;
    }

    .${portalClassName} .${DTClasses.DATEPICKER_DAY}:hover,
    .${portalClassName} .${DTClasses.DATEPICKER_DAY}:hover
    .${portalClassName} .${DTClasses.DATEPICKER_DAY}:focus,
    .${portalClassName} .${DTClasses.DATEPICKER_MONTH_SELECT} select:hover,
    .${portalClassName} .${DTClasses.DATEPICKER_YEAR_SELECT} select:hover,
    .${portalClassName} .${DTClasses.DATEPICKER_MONTH_SELECT} select:focus,
    .${portalClassName} .${DTClasses.DATEPICKER_YEAR_SELECT} select:focus,
    .${portalClassName} .${Classes.BUTTON}:hover {
      background: var(--wds-color-bg-hover);
    }

    .${portalClassName} .${DTClasses.DATEPICKER_DAY_SELECTED} {
      background-color: ${accentColor} !important;
    }

    .${portalClassName}  .${Classes.INPUT} {
      border-radius: ${borderRadius} !important;
    }

    .${portalClassName}  .${Classes.INPUT}:focus,
    .${portalClassName}  .${Classes.INPUT}:active {
      border: 1px solid ${accentColor} !important;
      box-shadow:  0px 0px 0px 2px ${lightenColor(accentColor)} !important;
    }

    .${portalClassName} .ads-dropdown-options-wrapper {
      border: 0px solid !important;
    }

    .${portalClassName} .${DTClasses.TIMEPICKER_INPUT_ROW} {
      box-shadow: 0px 0px 0px 1px var(--wds-color-border);
    }

    .${portalClassName} .${DTClasses.TIMEPICKER_INPUT_ROW}:hover {
      box-shadow: 0px 0px 0px 1px var(--wds-color-border-hover);
    }

    .${portalClassName} .${DTClasses.TIMEPICKER_INPUT}:focus {
      box-shadow: 0px 0px 0px 1px ${accentColor},
                  0px 0px 0px 3px ${lightenColor(accentColor)};
    }

    .${portalClassName} .${DTClasses.DATEPICKER_FOOTER} .${Classes.BUTTON} {
      color: ${accentColor};
    }

    .${portalClassName} .${DTClasses.DATEPICKER_FOOTER} .${
      Classes.BUTTON
    }:hover {
      background-color: ${lightenColor(accentColor)};
    }

    .${portalClassName} .${DTClasses.DATEPICKER_NAVBUTTON} span {
      color: var(--wds-color-icon) !important;
    }

    .${portalClassName} .${DTClasses.DATEPICKER_NAVBUTTON}:disabled span {
      color: var(--wds-color-icon-disabled) !important;
    }

    .${portalClassName} .${DTClasses.DATEPICKER_YEAR_SELECT} select + .${
      Classes.ICON
    }, .${portalClassName} .${DTClasses.DATEPICKER_MONTH_SELECT} select + .${
      Classes.ICON
    } {
      color: var(--wds-color-icon) !important;
    }

    .${portalClassName} .${DTClasses.DATERANGEPICKER_SHORTCUTS} li a {
      border-radius: ${borderRadius};
    }

    .${portalClassName} .${DTClasses.DATERANGEPICKER_SHORTCUTS} li a:hover {
      background-color: ${lightenColor(accentColor)};
    }

    .${portalClassName} .${DTClasses.DATERANGEPICKER_SHORTCUTS} li a.${
      Classes.ACTIVE
    } {
      color: ${getComplementaryGrayscaleColor(accentColor)};
      background-color: ${accentColor};
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export interface DynamicnHeightEnabledComponentProps {
  isDynamicHeightEnabled?: boolean;
}

export const getMainCanvas = () =>
  document.querySelector(`.${CANVAS_SELECTOR}`) as HTMLElement;

/*
 * Function that composes two or more hooks together in the updateHook
 * property of the property pane config
 *
 * - Often times we would wanna call more than one hook when a property is
 *   changed. Use this hook instead of nested calls
 *
 * Eack hook should either return `undefined` or an array of PropertyUpdates
 * this function ignores the undefined and concats all the property update array.
 */
export function composePropertyUpdateHook(
  updateFunctions: Array<
    (
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      props: any,
      propertyPath: string,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      propertyValue: any,
    ) => Array<PropertyUpdates> | undefined
  >,
): (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any,
  propertyPath: string,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyValue: any,
) => Array<PropertyUpdates> | undefined {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (props: any, propertyPath: string, propertyValue: any) => {
    if (updateFunctions.length) {
      let updates: PropertyUpdates[] = [];

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

export function getLocaleDecimalSeperator() {
  return Intl.NumberFormat(getLocale())
    .format(1.1)
    .replace(/\p{Number}/gu, "");
}

export function getLocaleThousandSeparator() {
  return Intl.NumberFormat(getLocale())
    .format(11111)
    .replace(/\p{Number}/gu, "");
}

interface DropdownOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  children?: DropdownOption[];
}

/*
 * Helps flatten nested Array of objects
 *  Array -> Object { value, label,  children : Array -> Object { value, label } }
 * This would be flattened to Array -> { value, label } , { value, label }
 */

export const flat = (array: DropdownOption[]) => {
  let result: { value: string | number; label: string }[] = [];

  array.forEach((a) => {
    result.push({ value: a.value, label: a.label });

    if (Array.isArray(a.children)) {
      result = result.concat(flat(a.children));
    }
  });

  return result;
};

/**
 * A utility function to check whether a widget has dynamic height enabled with limits?
 * @param props: Widget properties
 */

export const isAutoHeightEnabledForWidgetWithLimits = (props: WidgetProps) => {
  if (props?.isFlexChild) return false;

  return props.dynamicHeight === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS;
};

/**
 * A utility function to check whether a widget has dynamic height enabled?
 * @param props: Widget properties
 */

export const isAutoHeightEnabledForWidget = (props: WidgetProps) => {
  if (props?.isFlexChild) return false;

  return (
    props.dynamicHeight === DynamicHeight.AUTO_HEIGHT ||
    props.dynamicHeight === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS
  );
};

/**
 * Check if a container is scrollable or has scrollbars
 * "Container" here is any container like widget (Eg: Container, Tabs, etc)
 * @param widget: FlattenedWidgetProps
 * returns boolean
 */
export function checkContainerScrollable(
  widget: FlattenedWidgetProps,
): boolean {
  // if both scrolling and auto height is disabled, container is not scrollable
  // If auto height is enabled, the container is expected to be scrollable,
  // or the widget should already be in view.
  // If auto height is disabled, the container is scrollable only if scrolling is enabled
  return !(
    !isAutoHeightEnabledForWidget(widget) &&
    widget.shouldScrollContents === false
  );
}

/**
 * Gets the max possible height for the widget
 * @param props: WidgetProperties
 * @returns: The max possible height of the widget (in rows)
 */
export function getWidgetMaxAutoHeight(props: WidgetProps) {
  if (props.dynamicHeight === DynamicHeight.AUTO_HEIGHT) {
    return WidgetHeightLimits.MAX_HEIGHT_IN_ROWS;
  } else if (props.dynamicHeight === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS) {
    return props.maxDynamicHeight || WidgetHeightLimits.MAX_HEIGHT_IN_ROWS;
  }
}

/**
 * Gets the min possible height for the widget
 * @param props: WidgetProperties
 * @returns: The min possible height of the widget (in rows)
 */
export function getWidgetMinAutoHeight(props: WidgetProps) {
  if (props.dynamicHeight !== DynamicHeight.FIXED)
    return props.minDynamicHeight || WidgetHeightLimits.MIN_HEIGHT_IN_ROWS;
}

/**
 * A function which considers a widget's props and computes if it needs an auto height update
 * @param expectedHeightInPixels: number
 * @param props: WidgetProps
 * @returns boolean
 */
export function shouldUpdateWidgetHeightAutomatically(
  expectedHeightInPixels: number,
  props: WidgetProps,
): boolean {
  // The current height in rows of the widget
  const currentHeightInRows = props.bottomRow - props.topRow;

  // The expected height in rows for the widget
  const expectedHeightInRows = Math.ceil(
    expectedHeightInPixels / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  );

  // Does this widget have dynamic height enabled
  const isAutoHeightEnabled = isAutoHeightEnabledForWidget(props);

  // Run the following pieces of code only if dynamic height is enabled
  if (!isAutoHeightEnabled) return false;

  const maxAutoHeightInRows = getWidgetMaxAutoHeight(props);
  const minAutoHeightInRows = getWidgetMinAutoHeight(props);

  // If current height is less than the expected height
  // We're trying to see if we can increase the height
  if (currentHeightInRows < expectedHeightInRows) {
    // If our attempt to reduce does not go above the max possible height
    // And the difference in expected and current is atleast 1 row
    // We can safely reduce the height
    if (
      maxAutoHeightInRows >= currentHeightInRows &&
      Math.abs(currentHeightInRows - expectedHeightInRows) >= 1
    ) {
      return true;
    }
  }

  // If current height is greater than expected height
  // We're trying to see if we can reduce the height
  if (currentHeightInRows > expectedHeightInRows) {
    // If our attempt to reduce does not go below the min possible height
    // And the difference in expected and current is atleast 1 row
    // We can safely reduce the height
    if (
      minAutoHeightInRows < currentHeightInRows &&
      currentHeightInRows - expectedHeightInRows >= 1
    ) {
      return true;
    }
  }

  // If current height is more than the maxDynamicHeightInRows
  // Then we need to update height in any case, the call to update comes
  // at a good time. This usually happens when we change the max value from the
  // property pane.
  if (currentHeightInRows > maxAutoHeightInRows) {
    return true;
  }

  // The widget height should always be at least minDynamicHeightInRows
  // Same case as above, this time if minheight goes below the current.
  if (currentHeightInRows !== minAutoHeightInRows) {
    return true;
  }

  // Since the conditions to change height already return true
  // If we reach this point, we don't have to change height
  return false;
}
// This is to be applied to only those widgets which will scroll for example, container widget, etc.
// But this won't apply to CANVAS_WIDGET.
export const scrollCSS = css`
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  overflow-y: overlay;

  scrollbar-color: #cccccc transparent;
  scroolbar-width: thin;

  &::-webkit-scrollbar-thumb {
    background: #cccccc !important;
  }
  &::-webkit-scrollbar-track {
    background: transparent !important;
  }
`;

export const widgetTypeClassname = (widgetType: string): string =>
  `t--widget-${widgetType.split("_").join("").toLowerCase()}`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const findReactInstanceProps = (domElement: any) => {
  for (const key in domElement) {
    if (key.startsWith(REACT_ELEMENT_PROPS)) {
      return domElement[key];
    }
  }

  return null;
};

export function isCompactMode(componentHeight: number) {
  return (
    componentHeight <=
    COMPACT_MODE_MIN_ROWS * GridDefaults.DEFAULT_GRID_ROW_HEIGHT
  );
}

export const checkForOnClick = (e: React.MouseEvent<HTMLElement>) => {
  let target = e.target as HTMLElement | null;
  const currentTarget = e.currentTarget as HTMLElement;

  while (
    !target?.classList.contains(WIDGET_COMPONENT_BOUNDARY_CLASS) &&
    target &&
    target !== currentTarget
  ) {
    /**
     * NOTE: target.__reactProps$ returns undefined in cypress, therefore the below targetReactProps will be null.
     * Due to this the traversed target element's react props such as onClick will get ignored.
     **/
    const targetReactProps = findReactInstanceProps(target);

    const hasOnClickableEvent = Boolean(
      targetReactProps?.onClick ||
        targetReactProps?.onMouseDownCapture ||
        targetReactProps?.onMouseDown ||
        (target.onclick && target.onclick.name !== "noop"),
    );

    if (hasOnClickableEvent) {
      return true;
    }

    target = target.parentElement;
  }

  return false;
};

/**
 * Parses the derived properties from the given property functions. Used in getDerivedPropertiesMap
 *
 * @example
 * ```js
 * {
 *  isValidDate: (props, moment, _) => {
 *    return props.value === 1;
 *  }
 * ```
 *
 * It will return
 * ```js
 * {
 *  isValidDate: "{{ this.value === 1 }}"
 * }
 * ```
 *
 * Main rule to remember is don't deconstruct the props like `const { value } = props;` in the derived property function.
 * Directly access props like `props.value`
 */
export function parseDerivedProperties(propertyFns: Record<string, unknown>) {
  const derivedProperties: Record<string, string> = {};

  for (const [key, value] of Object.entries(propertyFns)) {
    if (typeof value === "function") {
      const functionString = value.toString();
      const functionBody = functionString.match(/(?<=\{)(.|\n)*(?=\})/)?.[0];

      if (functionBody) {
        const paramMatch = functionString.match(/\((.*?),/);
        const propsParam = paramMatch ? paramMatch[1].trim() : "props";

        const modifiedBody = functionBody
          .trim()
          .replace(new RegExp(`${propsParam}\\.`, "g"), "this.");

        derivedProperties[key] = modifiedBody;
      }
    }
  }

  return derivedProperties;
}
