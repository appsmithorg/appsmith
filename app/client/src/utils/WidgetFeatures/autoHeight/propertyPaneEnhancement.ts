import { DynamicHeight } from "./contants";
import { ValidationTypes } from "constants/WidgetValidation";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import EventEmitter from "utils/EventEmitter";
import {
  hideDynamicHeightPropertyControl,
  transformToNumber,
  updateMinMaxDynamicHeight,
  validateMaxHeight,
  validateMinHeight,
} from "./propertyValidationFunctions";

export default {
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
      dependencies: [
        "shouldScrollContents",
        "maxDynamicHeight",
        "minDynamicHeight",
        "bottomRow",
        "topRow",
      ],
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
      onBlur: () => {
        EventEmitter.emit("property_pane_input_blurred", "minDynamicHeight");
      },
      onFocus: () => {
        EventEmitter.emit("property_pane_input_focused", "minDynamicHeight");
      },
      label: "Min Height (in rows)",
      helpText: "Minimum number of rows to occupy irrespective of contents",
      controlType: "INPUT_TEXT",
      hidden: hideDynamicHeightPropertyControl,
      dependencies: ["dynamicHeight", "maxDynamicHeight"],
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
        EventEmitter.emit("property_pane_input_focused", "maxDynamicHeight");
      },
      onBlur: () => {
        EventEmitter.emit("property_pane_input_blurred", "maxDynamicHeight");
      },
      label: "Max Height (in rows)",
      helpText: "Maximum Height, after which contents will scroll",
      controlType: "INPUT_TEXT",
      dependencies: ["dynamicHeight", "minDynamicHeight"],
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
    },
  ],
};
