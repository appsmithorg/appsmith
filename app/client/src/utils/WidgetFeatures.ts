import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { WidgetProps } from "widgets/BaseWidget";

// eslint-disable-next-line prettier/prettier
import type { AutocompleteDataType } from "./autocomplete/TernServer";

export interface WidgetFeatures {
  dynamicHeight: boolean;
}

export enum DynamicHeight {
  HUG_CONTENTS = "HUG_CONTENTS",
  FIXED = "FIXED",
}

/* This contains all properties which will be added 
   to a widget, automatically, by the Appsmith platform
   Each feature, is a unique key, whose value is an object
   with the list of properties to be added to a widget along
   with their default values

   Note: These are added to the widget configs during registration
*/
export const WidgetFeatureProps = {
  DYNAMIC_HEIGHT: {
    minDynamicHeight: 0,
    maxDynamicHeight: 0,
    dynamicHeight: DynamicHeight.FIXED,
  },
};

/* Hide the min height and max height properties using this function
   as the `hidden` hook in the property pane configuration
   This function checks if the `dynamicHeight` property is enabled
   and returns true if disabled, and false if enabled.
*/
export function hideDynamicHeightPropertyControl(props: WidgetProps) {
  return props.dynamicHeight !== DynamicHeight.HUG_CONTENTS;
}

function validateMinHeight(value: unknown, props: WidgetProps) {
  const _value: number = parseInt(value as string, 10);
  const _maxHeight: number = parseInt(props.maxDynamicHeight as string, 10);
  if (isNaN(_value) || _value <= 2) {
    return {
      isValid: false,
      messages: [`Value should be a positive integer greater than 2`],
      parsed: 2,
    };
  } else if (_value > _maxHeight) {
    return {
      isValid: false,
      messages: [`Value should be less than or equal Max. Height`],
      parsed: _maxHeight || 2,
    };
  }
  return {
    isValid: true,
    parsed: _value,
    messages: [],
  };
}

function validateMaxHeight(value: unknown, props:WidgetProps) {
  const _value: number = parseInt(value as string, 10);
  const _minHeight: number = parseInt(props.minDynamicHeight as string, 10);
  if(isNaN(_value) || _value <= 2) {
    return {
      isValid: false,
      messages: [`Value should be a positive integer greater than 2`],
      parsed: 1000,
    }
  } else if (_value < _minHeight) {
    return {
      isValid: false,
      messages: [`Value should be greater than or equal Min. Height`],
      parsed: _minHeight || 2
    }
  }
  return {
    isValid: true,
    parsed: _value,
    messages: []
  }
}
// TODO FEATURE:(abhinav) Add validations to these properties
export const PropertyPaneConfigTemplates: Record<string, PropertyPaneConfig> = {
  DYNAMIC_HEIGHT: {
    sectionName: "Layout Features",
    children: [
      {
        helpText:
          "Dynamic Height: Configure the way the widget height react to content changes.",
        propertyName: "dynamicHeight",
        label: "Height",
        controlType: "DROP_DOWN",
        isBindProperty: false,
        isTriggerProperty: false,
        dependencies: ["shouldScrollContents"],
        updateHook: (
          props: WidgetProps,
          propertyName: string,
          propertyValue: string,
        ) => {
          if (
            propertyValue === DynamicHeight.HUG_CONTENTS &&
            props.shouldScrollContents === false &&
            propertyName === "dynamicHeight"
          ) {
            return [
              {
                propertyPath: "shouldScrollContents",
                propertyValue: true,
              },
            ];
          }
        },
        options: [
          {
            label: "Hug Contents",
            value: DynamicHeight.HUG_CONTENTS,
          },
          {
            label: "Fixed",
            value: DynamicHeight.FIXED,
          },
        ],
      },
      {
        propertyName: "minDynamicHeight",
        label: "Min Height (in rows)",
        helpText: "Minimum number of rows to occupy irrespective of contents",
        controlType: "INPUT_TEXT",
        hidden: hideDynamicHeightPropertyControl,
        dependencies: ["dynamicHeight"],
        isJSConvertible: false,
        isBindProperty: true,
        isTriggerProperty: false,
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
      },
      {
        propertyName: "maxDynamicHeight",
        label: "Max Height (in rows)",
        helpText: "Maximum Height, after which contents will scroll",
        controlType: "INPUT_TEXT",
        dependencies: ["dynamicHeight"],
        hidden: hideDynamicHeightPropertyControl,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: validateMaxHeight,
            expected: {
              type: "Number of Rows. Greater than or equal to Min. Height",
              example: 1000,
              autocompleteDataType: "NUMBER" as AutocompleteDataType,
            },
          },
        },
        isJSConvertible: false,
        isBindProperty: true,
        isTriggerProperty: false,
      },
    ],
  },
};
