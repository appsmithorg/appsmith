import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
} from "constants/PropertyControlConstants";
import { WidgetHeightLimits } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { WidgetProps } from "widgets/BaseWidget";
import { WidgetConfiguration } from "widgets/constants";

import { AutocompleteDataType } from "./autocomplete/TernServer";
import DynamicHeightCallbackHandler from "./CallbackHandler/DynamicHeightCallbackHandler";
import { CallbackHandlerEventType } from "./CallbackHandler/CallbackHandlerEventType";

export enum RegisteredWidgetFeatures {
  DYNAMIC_HEIGHT = "dynamicHeight",
}

export type WidgetFeatures = Record<RegisteredWidgetFeatures, boolean>;

export enum DynamicHeight {
  AUTO_HEIGHT = "AUTO_HEIGHT",
  FIXED = "FIXED",
  AUTO_HEIGHT_WITH_LIMITS = "AUTO_HEIGHT_WITH_LIMITS",
}

/* This contains all properties which will be added 
   to a widget, automatically, by the Appsmith platform
   Each feature, is a unique key, whose value is an object
   with the list of properties to be added to a widget along
   with their default values

   Note: These are added to the widget configs during registration
*/
export const WidgetFeatureProps: Record<
  RegisteredWidgetFeatures,
  Record<string, unknown>
> = {
  [RegisteredWidgetFeatures.DYNAMIC_HEIGHT]: {
    minDynamicHeight: WidgetHeightLimits.MIN_HEIGHT_IN_ROWS,
    maxDynamicHeight: WidgetHeightLimits.MAX_HEIGHT_IN_ROWS,
    dynamicHeight: DynamicHeight.FIXED,
  },
};

export const WidgetFeaturePropertyEnhancements: Record<
  RegisteredWidgetFeatures,
  (config: WidgetConfiguration) => Record<string, unknown>
> = {
  [RegisteredWidgetFeatures.DYNAMIC_HEIGHT]: (config: WidgetConfiguration) => {
    const newProperties: Partial<WidgetProps> = {};
    if (config.isCanvas) {
      newProperties.dynamicHeight = DynamicHeight.AUTO_HEIGHT;
      newProperties.shouldScrollContents = true;
      newProperties.originalTopRow = config.defaults.topRow;
      newProperties.originalBottomRow = config.defaults.bottomRow;
    }
    if (config.defaults.overflow) newProperties.overflow = "NONE";
    return newProperties;
  },
};

function findAndUpdatePropertyPaneControlConfig(
  config: PropertyPaneConfig[],
  propertyPaneUpdates: Record<string, Record<string, unknown>>,
): PropertyPaneConfig[] {
  return config.map((sectionConfig: PropertyPaneConfig) => {
    if (
      Array.isArray(sectionConfig.children) &&
      sectionConfig.children.length > 0
    ) {
      Object.keys(propertyPaneUpdates).forEach((propertyName: string) => {
        const controlConfigIndex:
          | number
          | undefined = sectionConfig.children?.findIndex(
          (controlConfig: PropertyPaneConfig) =>
            (controlConfig as PropertyPaneControlConfig).propertyName ===
            propertyName,
        );

        if (
          controlConfigIndex !== undefined &&
          controlConfigIndex > -1 &&
          sectionConfig.children
        ) {
          sectionConfig.children[controlConfigIndex] = {
            ...sectionConfig.children[controlConfigIndex],
            ...propertyPaneUpdates[propertyName],
          };
        }
      });
    }
    return sectionConfig;
  });
}

export const WidgetFeaturePropertyPaneEnhancements: Record<
  RegisteredWidgetFeatures,
  (config: PropertyPaneConfig[]) => PropertyPaneConfig[]
> = {
  [RegisteredWidgetFeatures.DYNAMIC_HEIGHT]: (config: PropertyPaneConfig[]) => {
    function hideWhenDynamicHeightIsEnabled(props: WidgetProps) {
      return (
        props.dynamicHeight === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS ||
        props.dynamicHeight === DynamicHeight.AUTO_HEIGHT
      );
    }
    return findAndUpdatePropertyPaneControlConfig(config, {
      shouldScrollContents: {
        hidden: hideWhenDynamicHeightIsEnabled,
        dependencies: ["dynamicHeight"],
      },
      scrollContents: {
        hidden: hideWhenDynamicHeightIsEnabled,
        dependencies: ["dynamicHeight"],
      },
      fixedFooter: {
        hidden: hideWhenDynamicHeightIsEnabled,
        dependencies: ["dynamicHeight"],
      },
      overflow: {
        hidden: hideWhenDynamicHeightIsEnabled,
        dependencies: ["dynamicHeight"],
      },
    });
  },
};

/* Hide the min height and max height properties using this function
   as the `hidden` hook in the property pane configuration
   This function checks if the `dynamicHeight` property is enabled
   and returns true if disabled, and false if enabled.
*/
export function hideDynamicHeightPropertyControl(props: WidgetProps) {
  return props.dynamicHeight !== DynamicHeight.AUTO_HEIGHT_WITH_LIMITS;
}

function validateMinHeight(value: unknown, props: WidgetProps) {
  const _value: number = parseInt(value as string, 10);
  const _maxHeight: number = parseInt(props.maxDynamicHeight as string, 10);

  if (isNaN(_value) || _value < 4) {
    return {
      isValid: false,
      messages: [`Value should be a positive integer greater than 4`],
      parsed: 4,
    };
  } else if (_value > _maxHeight) {
    return {
      isValid: false,
      messages: [`Value should be less than or equal Max. Height`],
      parsed: _maxHeight || 4,
    };
  }

  return {
    isValid: true,
    parsed: _value,
    messages: [],
  };
}

function validateMaxHeight(value: unknown, props: WidgetProps) {
  const _value: number = parseInt(value as string, 10);
  const _minHeight: number = parseInt(props.minDynamicHeight as string, 10);

  if (isNaN(_value) || _value < 4) {
    return {
      isValid: false,
      messages: [`Value should be a positive integer greater than 4`],
      parsed: 100,
    };
  } else if (_value < _minHeight) {
    return {
      isValid: false,
      messages: [`Value should be greater than or equal Min. Height`],
      parsed: _minHeight || 4,
    };
  }
  return {
    isValid: true,
    parsed: _value,
    messages: [],
  };
}
// TODO (abhinav): ADD_UNIT_TESTS
function updateMinMaxDynamicHeight(
  props: WidgetProps,
  propertyName: string,
  propertyValue: unknown,
) {
  const updates = [
    {
      propertyPath: propertyName,
      propertyValue: propertyValue,
    },
  ];

  if (propertyValue === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS) {
    const minDynamicHeight = parseInt(props.minDynamicHeight, 10);

    if (
      isNaN(minDynamicHeight) ||
      minDynamicHeight < WidgetHeightLimits.MIN_HEIGHT_IN_ROWS
    ) {
      updates.push({
        propertyPath: "minDynamicHeight",
        propertyValue: WidgetHeightLimits.MIN_HEIGHT_IN_ROWS,
      });
    }
    const maxDynamicHeight = parseInt(props.maxDynamicHeight, 10);
    if (
      isNaN(maxDynamicHeight) ||
      maxDynamicHeight === WidgetHeightLimits.MAX_HEIGHT_IN_ROWS ||
      maxDynamicHeight <= WidgetHeightLimits.MIN_HEIGHT_IN_ROWS
    ) {
      updates.push({
        propertyPath: "maxDynamicHeight",
        propertyValue: props.bottomRow - props.topRow,
      });
    }

    // Case where maxDynamicHeight is zero
    if (isNaN(maxDynamicHeight) || maxDynamicHeight === 0) {
      updates.push({
        propertyPath: "maxDynamicHeight",
        propertyValue: props.bottomRow - props.topRow,
      });
    }
  } else if (propertyValue === DynamicHeight.AUTO_HEIGHT) {
    updates.push(
      {
        propertyPath: "minDynamicHeight",
        propertyValue: WidgetHeightLimits.MIN_HEIGHT_IN_ROWS,
      },
      {
        propertyPath: "maxDynamicHeight",
        propertyValue: WidgetHeightLimits.MAX_HEIGHT_IN_ROWS,
      },
    );
  }

  if (propertyValue === DynamicHeight.FIXED) {
    updates.push({
      propertyPath: "originalBottomRow",
      propertyValue: undefined,
    });
    updates.push({
      propertyPath: "originalTopRow",
      propertyValue: undefined,
    });
  }

  // The following are updates which apply to specific widgets.
  if (
    propertyValue === DynamicHeight.AUTO_HEIGHT ||
    propertyValue === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS
  ) {
    if (props.dynamicHeight === DynamicHeight.FIXED) {
      updates.push({
        propertyPath: "originalBottomRow",
        propertyValue: props.bottomRow,
      });
      updates.push({
        propertyPath: "originalTopRow",
        propertyValue: props.topRow,
      });
    }
    if (!props.shouldScrollContents) {
      updates.push({
        propertyPath: "shouldScrollContents",
        propertyValue: true,
      });
    }
    if (props.overflow !== undefined) {
      updates.push({
        propertyPath: "overflow",
        propertyValue: "NONE",
      });
    }
    if (props.scrollContents === true) {
      updates.push({
        propertyPath: "scrollContents",
        propertyValue: false,
      });
    }
    if (props.fixedFooter === true) {
      updates.push({
        propertyPath: "fixedFooter",
        propertyValue: false,
      });
    }
  }

  return updates;
}

function transformToNumber(
  props: WidgetProps,
  propertyName: string,
  propertyValue: string,
) {
  // console.log("Dynamic Height: Transforming number:", propertyValue);
  let value = parseInt(propertyValue, 10);
  if (Number.isNaN(value)) {
    value = props[propertyName];
  }
  const propertiesToUpdate = [];
  // if (propertyName === "minDynamicHeight") {
  //   if (value < WidgetHeightLimits.MIN_HEIGHT_IN_ROWS)
  //     value = WidgetHeightLimits.MIN_HEIGHT_IN_ROWS;
  //   if (props.maxDynamicHeight < value) {
  //     value = props.minDynamicHeight;
  //   }
  // }
  // if (propertyName === "maxDynamicHeight") {
  //   if (value < WidgetHeightLimits.MIN_HEIGHT_IN_ROWS)
  //     value = WidgetHeightLimits.MIN_HEIGHT_IN_ROWS;
  //   if (props.minDynamicHeight > value) {
  //     value = props.maxDynamicHeight;
  //   }
  // }
  propertiesToUpdate.push({
    propertyPath: propertyName,
    propertyValue: value,
  });
  return propertiesToUpdate;
}
// TODO FEATURE:(abhinav) Add validations to these properties

const CONTAINER_SCROLL_HELPER_TEXT =
  "While editing, this widget may scroll contents to facilitate adding widgets. When published, the widget may not scroll contents.";

export const PropertyPaneConfigTemplates: Record<
  RegisteredWidgetFeatures,
  PropertyPaneConfig[]
> = {
  [RegisteredWidgetFeatures.DYNAMIC_HEIGHT]: [
    {
      helpText:
        "Auto Height: Configure the way the widget height reacts to content changes.",
      propertyName: "dynamicHeight",
      label: "Height",
      controlType: "DROP_DOWN",
      isBindProperty: false,
      isTriggerProperty: false,
      dependencies: [
        "shouldScrollContents",
        "maxDynamicHeight",
        "minDynamicHeight",
        "bottomRow",
        "topRow",
        "overflow",
        "dynamicHeight",
        "isCanvas",
      ],
      updateHook: updateMinMaxDynamicHeight,
      helperText: (props: WidgetProps) => {
        return props.isCanvas &&
          props.dynamicHeight === DynamicHeight.AUTO_HEIGHT
          ? CONTAINER_SCROLL_HELPER_TEXT
          : "";
      },
      options: [
        {
          label: "Auto Height",
          value: DynamicHeight.AUTO_HEIGHT,
        },
        {
          label: "Auto Height with limits",
          value: DynamicHeight.AUTO_HEIGHT_WITH_LIMITS,
        },
        {
          label: "Fixed",
          value: DynamicHeight.FIXED,
        },
      ],
      postUpdateActions: [ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT],
    },
    {
      propertyName: "minDynamicHeight",
      min: WidgetHeightLimits.MIN_HEIGHT_IN_ROWS,
      onBlur: () => {
        DynamicHeightCallbackHandler.emit(
          CallbackHandlerEventType.MIN_HEIGHT_LIMIT_BLUR,
        );
      },
      onFocus: () => {
        DynamicHeightCallbackHandler.emit(
          CallbackHandlerEventType.MIN_HEIGHT_LIMIT_FOCUS,
        );
      },
      label: "Min Height (in rows)",
      helpText: "Minimum number of rows to occupy irrespective of contents",
      controlType: "NUMERIC_INPUT",
      hidden: hideDynamicHeightPropertyControl,
      dependencies: ["dynamicHeight", "maxDynamicHeight", "minDynamicHeight"],
      isJSConvertible: false,
      isBindProperty: true,
      isTriggerProperty: false,
      updateHook: transformToNumber,
      validation: {
        type: ValidationTypes.FUNCTION,
        params: {
          fn: validateMinHeight,
          expected: {
            type: "Number of Rows. Less than or equal to Max Height",
            example: 10,
            autocompleteDataType: "NUMBER" as AutocompleteDataType,
          },
        },
      },
      postUpdateActions: [ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT],
    },
    {
      propertyName: "maxDynamicHeight",
      min: WidgetHeightLimits.MIN_HEIGHT_IN_ROWS,
      onFocus: () => {
        DynamicHeightCallbackHandler.emit(
          CallbackHandlerEventType.MAX_HEIGHT_LIMIT_FOCUS,
        );
      },
      onBlur: () => {
        DynamicHeightCallbackHandler.emit(
          CallbackHandlerEventType.MAX_HEIGHT_LIMIT_BLUR,
        );
      },
      label: "Max Height (in rows)",
      helpText: "Maximum Height, after which contents will scroll.",
      controlType: "NUMERIC_INPUT",
      dependencies: ["dynamicHeight", "minDynamicHeight", "maxDynamicHeight"],
      hidden: hideDynamicHeightPropertyControl,
      updateHook: transformToNumber,
      validation: {
        type: ValidationTypes.FUNCTION,
        params: {
          fn: validateMaxHeight,
          expected: {
            type: "Number of Rows. Greater than or equal to Min. Height",
            example: 100,
            autocompleteDataType: "NUMBER" as AutocompleteDataType,
          },
        },
      },
      isJSConvertible: false,
      isBindProperty: true,
      isTriggerProperty: false,
      postUpdateActions: [ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT],
    },
  ],
};
