import { ValidationTypes } from "constants/WidgetValidation";
import { FieldType } from "widgets/JSONFormWidget/constants";
import {
  HiddenFnParams,
  getSchemaItem,
  getAutocompleteProperties,
} from "../helper";

const PROPERTIES = {
  general: [
    {
      propertyName: "defaultValue",
      helpText: "Sets a default selected option",
      label: "Default Selected Value",
      placeholderText: "Y",
      controlType: "JSON_FORM_COMPUTE_VALUE",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.RADIO_GROUP),
      dependencies: ["schema", "sourceData"],
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
      additionalAutoComplete: getAutocompleteProperties,
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.RADIO_GROUP),
      dependencies: ["schema", "sourceData"],
    },
  ],
};

export default PROPERTIES;
