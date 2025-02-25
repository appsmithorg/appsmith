import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "ee/entities/DataTree/types";

export const propertyPaneContentConfig = [
  {
    sectionName: "Data",
    children: [
      {
        helpText:
          "Displays a list of options for a user to select. Values must be unique",
        propertyName: "options",
        label: "Options",
        controlType: "OPTION_INPUT",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.ARRAY,
          params: {
            default: [],
            unique: ["value"],
            children: {
              type: ValidationTypes.OBJECT,
              params: {
                required: true,
                allowedKeys: [
                  {
                    name: "label",
                    type: ValidationTypes.TEXT,
                    params: {
                      default: "",
                      required: true,
                      unique: true,
                    },
                  },
                  {
                    name: "value",
                    type: ValidationTypes.TEXT,
                    params: {
                      default: "",
                      unique: true,
                    },
                  },
                ],
              },
            },
          },
        },
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      {
        helpText: "Sets the values of the options turned on by default",
        propertyName: "defaultSelectedValues",
        label: "Default selected values",
        placeholderText: '["BLUE", "RED"]',
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.ARRAY,
          params: {
            default: [],
            children: {
              type: ValidationTypes.TEXT,
            },
            strict: true,
          },
        },
      },
      {
        helpText: "Controls widget orientation",
        propertyName: "orientation",
        label: "Orientation",
        controlType: "ICON_TABS",
        fullWidth: true,
        options: [
          {
            label: "Horizontal",
            value: "horizontal",
          },
          {
            label: "Vertical",
            value: "vertical",
          },
        ],
        defaultValue: "vertical",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        helpText: "Sets the label position of the widget",
        propertyName: "labelPosition",
        label: "Options Label Position",
        controlType: "ICON_TABS",
        fullWidth: true,
        options: [
          { label: "Start", value: "start" },
          { label: "End", value: "end" },
        ],
        isBindProperty: false,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        defaultValue: "end",
      },
    ],
  },
  {
    sectionName: "Label",
    children: [
      {
        helpText: "Sets the label text of the widget",
        propertyName: "label",
        label: "Text",
        controlType: "INPUT_TEXT",
        placeholderText: "Label",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        helpText: "Show help text or details about current input",
        propertyName: "labelTooltip",
        label: "Tooltip",
        controlType: "INPUT_TEXT",
        placeholderText: "Colors look darker on prints",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
  {
    sectionName: "General",
    children: [
      {
        propertyName: "isVisible",
        label: "Visible",
        helpText: "Controls the visibility of the widget",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.BOOLEAN,
        },
      },
      {
        propertyName: "isDisabled",
        label: "Disabled",
        controlType: "SWITCH",
        helpText: "Disables input to this widget",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.BOOLEAN,
        },
      },
      {
        propertyName: "animateLoading",
        label: "Animate loading",
        controlType: "SWITCH",
        helpText: "Controls the loading of the widget",
        defaultValue: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
  {
    sectionName: "Events",
    children: [
      {
        helpText: "When the switch state in the group is changed",
        propertyName: "onSelectionChange",
        label: "onSelectionChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
];
