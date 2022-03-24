import { ValidationTypes } from "constants/WidgetValidation";
import { FieldType } from "widgets/JSONFormWidget/constants";
import { HiddenFnParams, getSchemaItem } from "../helper";

const PROPERTIES = {
  general: [
    {
      helpText:
        "Sets the default value of the field. The array is updated when the default value changes",
      propertyName: "defaultValue",
      label: "Default Value",
      controlType: "JSON_FORM_COMPUTE_VALUE",
      placeholderText: "[]",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.ARRAY,
      },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.ARRAY),
      dependencies: ["schema"],
    },
  ],
  accessibility: [
    {
      propertyName: "isCollapsible",
      label: "Collapsible",
      helpText: "Makes the array items collapsible",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      validation: { type: ValidationTypes.BOOLEAN },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.ARRAY),
      dependencies: ["schema"],
    },
  ],
};

export default PROPERTIES;
