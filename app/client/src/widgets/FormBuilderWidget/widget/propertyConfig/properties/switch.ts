import { ValidationTypes } from "constants/WidgetValidation";
import { FieldType } from "widgets/FormBuilderWidget/constants";
import { HiddenFnParams, getSchemaItem } from "../helper";

const PROPERTIES = {
  general: [
    {
      propertyName: "defaultValue",
      label: "Default Selected",
      helpText:
        "On / Off the Switch by default. Changes to the default selection update the widget state",
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
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.SWITCH),
      dependencies: ["schema", "sourceData"],
    },
  ],
};

export default PROPERTIES;
