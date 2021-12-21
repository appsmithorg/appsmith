import { ValidationTypes } from "constants/WidgetValidation";
import { FieldType } from "widgets/JSONFormWidget/constants";
import { HiddenFnParams, getSchemaItem } from "../helper";

const PROPERTIES = {
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
