import { ValidationTypes } from "constants/WidgetValidation";
import { FieldType } from "widgets/JSONFormWidget/constants";
import {
  HiddenFnParams,
  getSchemaItem,
  getAutocompleteProperties,
} from "../helper";

const PROPERTIES = {
  content: {
    data: [
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
    ],
    label: [
      {
        propertyName: "alignWidget",
        helpText: "Sets the position of the field",
        label: "Position",
        controlType: "ICON_TABS",
        fullWidth: true,
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
    events: [
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
  },
};

export default PROPERTIES;
