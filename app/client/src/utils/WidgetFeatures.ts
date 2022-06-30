import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { WidgetHeightLimits } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { WidgetProps } from "widgets/BaseWidget";

// eslint-disable-next-line prettier/prettier
import type { AutocompleteDataType } from "./autocomplete/TernServer";

export interface WidgetFeatures {
  dynamicHeight: boolean;
}

export enum DynamicHeight {
  AUTO_HEIGHT = "AUTO_HEIGHT",
  FIXED = "FIXED",
  AUTO_HEIGHT_WITH_LIMITS = "AUTO_HEIGHT_WITH_LIMITS"
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
  return props.dynamicHeight !== DynamicHeight.AUTO_HEIGHT_WITH_LIMITS;
}

function validateMinHeight(value: unknown, props: WidgetProps) {
  const _value: number = parseInt(value as string, 10);
  const _maxHeight: number = parseInt(props.maxDynamicHeight as string, 10);
  if (isNaN(_value) || _value <= 2) {
    return {
      isValid: false,
      messages: [`Value should be a positive integer greater than ${WidgetHeightLimits.MIN_HEIGHT_IN_ROWS}`],
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

function validateMaxHeight(value: unknown, props:WidgetProps) {
  const _value: number = parseInt(value as string, 10);
  const _minHeight: number = parseInt(props.minDynamicHeight as string, 10);
  if(isNaN(_value) || _value <= 2) {
    return {
      isValid: false,
      messages: [`Value should be a positive integer greater than 2`],
      parsed: 9000,
    }
  } else if (_value < _minHeight) {
    return {
      isValid: false,
      messages: [`Value should be greater than or equal Min. Height`],
      parsed: _minHeight || 4
    }
  }
  return {
    isValid: true,
    parsed: _value,
    messages: []
  }
}
// TODO (abhinav): ADD_UNIT_TESTS
function updateMinMaxDynamicHeight(
  props: WidgetProps,
  propertyName: string,
  propertyValue: unknown,
) {
  const updates = [{
    propertyPath: propertyName,
    propertyValue: propertyValue,
  }];
  if(propertyValue === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS) {
    const minDynamicHeight = parseInt(props.minDynamicHeight, 10);
    if(isNaN(minDynamicHeight) || minDynamicHeight < WidgetHeightLimits.MIN_HEIGHT_IN_ROWS){
    updates.push({
      propertyPath: "minDynamicHeight",
      propertyValue: WidgetHeightLimits.MIN_HEIGHT_IN_ROWS
    })            
    }
    const maxDynamicHeight = parseInt(props.maxDynamicHeight, 10);
    if(isNaN(maxDynamicHeight) || maxDynamicHeight < (props.bottomRow - props.topRow)) {
      updates.push({
        propertyPath: "maxDynamicHeight",
        propertyValue: WidgetHeightLimits.MAX_HEIGHT_IN_ROWS
      })
    }
  } else if(propertyValue === DynamicHeight.AUTO_HEIGHT) {
    updates.push({
      propertyPath: "minDynamicHeight",
      propertyValue: WidgetHeightLimits.MIN_HEIGHT_IN_ROWS
    }, {
      propertyPath: "maxDynamicHeight",
      propertyValue: WidgetHeightLimits.MAX_HEIGHT_IN_ROWS
    })
  }
  
  if (
    (propertyValue === DynamicHeight.AUTO_HEIGHT || propertyValue === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS) &&
    props.shouldScrollContents === false
  ) {
    updates.push(
      {
        propertyPath: "shouldScrollContents",
        propertyValue: true,
      })
  }

  return updates;
}

function transformToNumber(props: WidgetProps,
  propertyName: string,
  propertyValue: string) {
    return [{
      propertyPath: propertyName,
      propertyValue: parseInt(propertyValue, 10)
    }]
  }
// TODO FEATURE:(abhinav) Add validations to these properties

export const PropertyPaneConfigTemplates = {
  DYNAMIC_HEIGHT: {
    sectionName: "Layout Features",
    hidden:(props: any) => { if(props.type === "TABLE_WIDGET") return !props.serverSidePaginationEnabled; else return false; },
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
        updateHook: updateMinMaxDynamicHeight,
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
      },
      {
        propertyName: "maxDynamicHeight",
        onFocus: () => {
          console.log("onFocus", "FOCUSED");
        },
        label: "Max Height (in rows)",
        helpText: "Maximum Height, after which contents will scroll",
        controlType: "INPUT_TEXT",
        dependencies: ["dynamicHeight"],
        hidden: hideDynamicHeightPropertyControl,
        updateHook: transformToNumber,
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
