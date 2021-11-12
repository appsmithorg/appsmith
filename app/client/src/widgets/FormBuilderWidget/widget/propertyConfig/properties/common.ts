import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import {
  FieldType,
  FIELD_EXPECTING_OPTIONS,
} from "widgets/FormBuilderWidget/constants";
import {
  fieldTypeUpdateHook,
  HiddenFnParams,
  getSchemaItem,
  hiddenIfArrayItemIsObject,
} from "../helper";

const COMMON_PROPERTIES = {
  fieldType: [
    {
      propertyName: "fieldType",
      label: "Field Type",
      controlType: "DROP_DOWN",
      isBindProperty: false,
      isTriggerProperty: false,
      options: Object.values(FieldType).map((option) => ({
        label: option,
        value: option,
      })),
      dependencies: ["schema"],
      updateHook: fieldTypeUpdateHook,
    },
  ],
  options: [
    {
      propertyName: "options",
      helpText:
        "Allows users to select from the given option(s). Values must be unique",
      label: "Options",
      controlType: "INPUT_TEXT",
      placeholderText: '[{ "label": "Option1", "value": "Option2" }]',
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.ARRAY,
        params: {
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
                  },
                },
                {
                  name: "value",
                  type: ValidationTypes.TEXT,
                  params: {
                    default: "",
                    required: true,
                  },
                },
              ],
            },
          },
        },
      },
      evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotIncludes(FIELD_EXPECTING_OPTIONS),
      dependencies: ["schema"],
    },
  ],
  accessibility: [
    {
      helpText: "Sets the label text of the widget",
      propertyName: "label",
      label: "Label",
      controlType: "INPUT_TEXT",
      placeholderText: "Name:",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
      hidden: hiddenIfArrayItemIsObject,
      dependencies: ["schema"],
    },
    {
      propertyName: "isRequired",
      label: "Required",
      helpText: "Makes input to the widget mandatory",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
      hidden: hiddenIfArrayItemIsObject,
      dependencies: ["schema"],
    },
    {
      helpText: "Controls the visibility of the field",
      propertyName: "isVisible",
      label: "Visible",
      controlType: "SWITCH",
      defaultValue: true,
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
      hidden: hiddenIfArrayItemIsObject,
      dependencies: ["schema"],
    },
    {
      helpText: "Disables the field",
      propertyName: "isDisabled",
      label: "Disabled",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
      hidden: hiddenIfArrayItemIsObject,
      dependencies: ["schema"],
    },
    {
      helpText: "Show help text or details about current input",
      propertyName: "tooltip",
      label: "Tooltip",
      controlType: "INPUT_TEXT",
      placeholderText: "Passwords must be at-least 6 chars",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
      hidden: hiddenIfArrayItemIsObject,
      dependencies: ["schema"],
    },
  ],
  labelStyles: [
    {
      propertyName: "labelTextColor",
      label: "Text Color",
      controlType: "COLOR_PICKER",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          regex: /^(?![<|{{]).+/,
        },
      },
    },
    {
      propertyName: "labelTextSize",
      label: "Text Size",
      controlType: "DROP_DOWN",
      options: [
        {
          label: "Heading 1",
          value: "HEADING1",
          subText: "24px",
          icon: "HEADING_ONE",
        },
        {
          label: "Heading 2",
          value: "HEADING2",
          subText: "18px",
          icon: "HEADING_TWO",
        },
        {
          label: "Heading 3",
          value: "HEADING3",
          subText: "16px",
          icon: "HEADING_THREE",
        },
        {
          label: "Paragraph",
          value: "PARAGRAPH",
          subText: "14px",
          icon: "PARAGRAPH",
        },
        {
          label: "Paragraph 2",
          value: "PARAGRAPH2",
          subText: "12px",
          icon: "PARAGRAPH_TWO",
        },
      ],
      isBindProperty: false,
      isTriggerProperty: false,
    },
    {
      propertyName: "labelStyle",
      label: "Label Font Style",
      controlType: "BUTTON_TABS",
      options: [
        {
          icon: "BOLD_FONT",
          value: "BOLD",
        },
        {
          icon: "ITALICS_FONT",
          value: "ITALIC",
        },
      ],
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
    },
  ],
  actions: [
    {
      propertyName: "onFocus",
      helpText: "Triggers an action when focused.",
      label: "onFocus",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
    },
    {
      propertyName: "onBlur",
      helpText: "Triggers an action when the field loses focus.",
      label: "onBlur",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
    },
  ],
};

export default COMMON_PROPERTIES;
