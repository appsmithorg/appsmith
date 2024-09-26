import { ValidationTypes } from "constants/WidgetValidation";

import { isReadOnlyUpdateHook } from "../helpers";
import type { BaseInputWidgetProps } from "../widget/types";

export const propertyPaneContentConfig = [
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
    ],
  },
  {
    sectionName: "Validation",
    children: [
      {
        helpText:
          "Adds a validation to the input which displays an error on failure",
        propertyName: "regex",
        label: "Regex",
        controlType: "INPUT_TEXT",
        placeholderText: "^\\w+@[a-zA-Z_]$",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.REGEX },
      },
      {
        helpText: "Sets the input validity based on a JS expression",
        propertyName: "validation",
        label: "Valid",
        controlType: "INPUT_TEXT",
        placeholderText: "{{ Input1.isValid }}",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.BOOLEAN,
          params: {
            default: true,
          },
        },
      },
      {
        helpText:
          "The error message to display if the regex or valid property check fails",
        propertyName: "errorMessage",
        label: "Error message",
        controlType: "INPUT_TEXT",
        placeholderText: "Not a valid value!",
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
        helpText: "Show help text or details about current input",
        propertyName: "tooltip",
        label: "Tooltip",
        controlType: "INPUT_TEXT",
        placeholderText: "Tooltips show contextual help",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        hidden: (props: BaseInputWidgetProps) => {
          return Boolean(props.isReadOnly);
        },
      },
      {
        helpText: "Sets a placeholder text for the input",
        propertyName: "placeholderText",
        label: "Placeholder",
        controlType: "INPUT_TEXT",
        placeholderText: "Value placeholder",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        hidden: (props: BaseInputWidgetProps) => {
          return Boolean(props.isReadOnly);
        },
      },
      {
        helpText: "Controls the visibility of the widget",
        propertyName: "isVisible",
        label: "Visible",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        helpText: "Disables input to this widget",
        propertyName: "isDisabled",
        label: "Disabled",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
        hidden: (props: BaseInputWidgetProps) => {
          return Boolean(props.isReadOnly);
        },
      },
      {
        helpText:
          "Whether the input can be selected but not changed by the user. Readonly has a higher priority than disabled.",
        propertyName: "isReadOnly",
        label: "Readonly",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        dependencies: ["type", "inputType"],
        updateHook: isReadOnlyUpdateHook,
        validation: { type: ValidationTypes.BOOLEAN },
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
      {
        helpText: "Focus input automatically on load",
        propertyName: "autoFocus",
        label: "Auto focus",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
        hidden: (props: BaseInputWidgetProps) => {
          return Boolean(props.isReadOnly);
        },
      },
      {
        propertyName: "allowFormatting",
        label: "Enable formatting",
        helpText: "Formats the phone number as per the country selected",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
        hidden: (props: BaseInputWidgetProps) => {
          return props.type !== "PHONE_INPUT_WIDGET";
        },
      },
    ],
  },
  {
    sectionName: "Events",
    hidden: (props: BaseInputWidgetProps) => {
      return Boolean(props.isReadOnly);
    },
    children: [
      {
        helpText: "when the text is changed",
        propertyName: "onTextChanged",
        label: "onTextChanged",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        helpText: "when the input field receives focus",
        propertyName: "onFocus",
        label: "onFocus",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        helpText: "when the input field loses focus",
        propertyName: "onBlur",
        label: "onBlur",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        helpText: "on submit (when the enter key is pressed)",
        propertyName: "onSubmit",
        label: "onSubmit",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        helpText: "Clears the input value after submit",
        propertyName: "resetOnSubmit",
        label: "Reset on submit",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
];
