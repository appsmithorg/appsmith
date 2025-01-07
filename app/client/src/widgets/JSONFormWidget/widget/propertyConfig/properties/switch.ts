import { ValidationTypes } from "constants/WidgetValidation";
import { FieldType } from "widgets/JSONFormWidget/constants";
import type { HiddenFnParams } from "../helper";
import { getSchemaItem, getAutocompleteProperties } from "../helper";
import { AlignWidgetTypes } from "WidgetProvider/constants";
import { LabelPosition } from "components/constants";

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
        helpText: "Sets the label position of the widget",
        propertyName: "labelPosition",
        label: "Position",
        controlType: "ICON_TABS",
        fullWidth: true,
        options: [
          { label: "Left", value: LabelPosition.Left },
          { label: "Right", value: LabelPosition.Right },
        ],
        defaultValue: LabelPosition.Left,
        isBindProperty: false,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.SWITCH),
        dependencies: ["schema"],
      },
      {
        propertyName: "alignWidget",
        helpText: "Sets alignment of the widget",
        label: "Alignment",
        controlType: "LABEL_ALIGNMENT_OPTIONS",
        isBindProperty: true,
        isTriggerProperty: false,
        fullWidth: false,
        defaultValue: AlignWidgetTypes.LEFT,
        options: [
          {
            startIcon: "align-left",
            value: AlignWidgetTypes.LEFT,
          },
          {
            startIcon: "align-right",
            value: AlignWidgetTypes.RIGHT,
          },
        ],
        validation: { type: ValidationTypes.TEXT },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.SWITCH),
        dependencies: ["schema"],
      },
    ],
    events: [
      {
        helpText: "when the switch state is changed",
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
