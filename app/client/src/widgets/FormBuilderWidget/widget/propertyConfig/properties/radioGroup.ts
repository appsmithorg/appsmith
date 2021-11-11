import { ValidationTypes } from "constants/WidgetValidation";
import { FieldType } from "widgets/FormBuilderWidget/constants";
import { HiddenFnParams, getSchemaItem } from "../helper";

const PROPERTIES = {
  general: [
    {
      propertyName: "defaultValue",
      helpText: "Sets a default selected option",
      label: "Default Selected Value",
      placeholderText: "Y",
      controlType: "INPUT_TEXT",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.RADIO_GROUP),
      dependencies: ["schema"],
    },
  ],
  actions: [
    {
      propertyName: "onSelectionChange",
      helpText: "Triggers an action when a user changes the selected option",
      label: "onSelectionChange",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.RADIO_GROUP),
      dependencies: ["schema"],
    },
  ],
};

export default PROPERTIES;
