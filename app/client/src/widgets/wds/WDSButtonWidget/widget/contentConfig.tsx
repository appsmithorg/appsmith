import { RecaptchaTypes } from "components/constants";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { ValidationTypes } from "constants/WidgetValidation";

export const propertyPaneContentConfig = [
  {
    sectionName: "Basic",
    children: [
      {
        propertyName: "text",
        label: "Label",
        helpText: "Sets the label of the button",
        controlType: "INPUT_TEXT",
        placeholderText: "Submit",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        helpText: "when the button is clicked",
        propertyName: "onClick",
        label: "onClick",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
  {
    sectionName: "General",
    children: [
      {
        helpText: "Show helper text with button on hover",
        propertyName: "tooltip",
        label: "Tooltip",
        controlType: "INPUT_TEXT",
        placeholderText: "Submits Form",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "isVisible",
        label: "Visible",
        helpText: "Controls the visibility of the widget",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "isDisabled",
        label: "Disabled",
        controlType: "SWITCH",
        helpText: "Disables clicks to this widget",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
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
    ],
  },
  {
    sectionName: "Validation",
    hidden: isAirgapped,
    children: [
      {
        propertyName: "googleRecaptchaKey",
        label: "Google reCAPTCHA key",
        helpText: "Sets Google reCAPTCHA site key for the button",
        controlType: "INPUT_TEXT",
        placeholderText: "reCAPTCHA Key",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "recaptchaType",
        label: "Google reCAPTCHA version",
        controlType: "DROP_DOWN",
        helpText: "Select reCAPTCHA version",
        options: [
          {
            label: "reCAPTCHA v3",
            value: RecaptchaTypes.V3,
          },
          {
            label: "reCAPTCHA v2",
            value: RecaptchaTypes.V2,
          },
        ],
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [RecaptchaTypes.V3, RecaptchaTypes.V2],
            default: RecaptchaTypes.V3,
          },
        },
      },
    ],
  },
  // TODO: refactor widgetParentProps implementation when we address #10659
  {
    sectionName: "Form settings",
    children: [
      {
        helpText:
          "Disabled if the form is invalid, if this widget exists directly within a Form widget.",
        propertyName: "disabledWhenInvalid",
        label: "Disabled invalid forms",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        helpText:
          "Resets the fields of the form, on click, if this widget exists directly within a Form widget.",
        propertyName: "resetFormOnClick",
        label: "Reset form on success",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
];
