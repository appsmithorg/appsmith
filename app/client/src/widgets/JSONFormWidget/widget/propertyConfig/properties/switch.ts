import { ValidationTypes } from "constants/WidgetValidation";
import { FieldType } from "widgets/JSONFormWidget/constants";
import {
  HiddenFnParams,
  getSchemaItem,
  getAutocompleteProperties,
  getStylesheetValue,
} from "../helper";

const PROPERTIES = {
  general: [
    {
      propertyName: "defaultValue",
      label: "Default Selected",
      helpText: "Sets the On/Off default state of the field",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      validation: { type: ValidationTypes.BOOLEAN },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.SWITCH),
      dependencies: ["schema", "sourceData"],
    },
    {
      propertyName: "alignWidget",
      helpText: "Sets the alignment of the field",
      label: "Alignment",
      controlType: "DROP_DOWN",
      isBindProperty: true,
      isTriggerProperty: false,
      options: [
        {
          label: "Left",
          value: "LEFT",
        },
        {
          label: "Right",
          value: "RIGHT",
        },
      ],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.SWITCH),
      dependencies: ["schema"],
    },
  ],
  actions: [
    {
      helpText: "Triggers an action when the switch state is changed",
      propertyName: "onChange",
      label: "onChange",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
      additionalAutoComplete: getAutocompleteProperties,
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.SWITCH),
      dependencies: ["schema", "sourceData"],
    },
  ],
  styles: [
    {
      propertyName: "accentColor",
      helpText: "Sets the accent color of the switch",
      label: "Accent Color",
      controlType: "COLOR_PICKER",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      getStylesheetValue,
      validation: { type: ValidationTypes.TEXT },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.SWITCH),
      dependencies: ["schema"],
    },
  ],
};

export default PROPERTIES;
