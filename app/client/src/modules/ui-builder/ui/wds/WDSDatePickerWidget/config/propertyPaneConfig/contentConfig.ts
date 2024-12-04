import { ValidationTypes } from "constants/WidgetValidation";
import { DATE_FORMAT_OPTIONS } from "../../constants";

import { propertyPaneContentConfig as WdsInputWidgetPropertyPaneContentConfig } from "modules/ui-builder/ui/wds/WDSInputWidget/config/propertyPaneConfig/contentConfig";
import type { PropertyPaneConfig } from "constants/PropertyControlConstants";

const inputTypeSectionConfig = WdsInputWidgetPropertyPaneContentConfig.find(
  (config) => config.sectionName === "Type",
);

export const propertyPaneContentConfig = [
  inputTypeSectionConfig,
  {
    sectionName: "Data",
    children: [
      {
        helpText: "Sets the format of the selected date",
        propertyName: "dateFormat",
        label: "Date format",
        controlType: "DROP_DOWN",
        isJSConvertible: true,
        optionWidth: "340px",
        options: DATE_FORMAT_OPTIONS,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        hideSubText: true,
      },
      {
        propertyName: "defaultDate",
        label: "Default Date",
        helpText:
          "Sets the default date of the widget. The date is updated if the default date changes",
        controlType: "DATE_PICKER",
        placeholderText: "Enter Default Date",
        useValidationMessage: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.DATE_ISO_STRING },
      },
      {
        propertyName: "timePrecision",
        label: "Time Precision",
        controlType: "DROP_DOWN",
        helpText: "Sets the time precision or hides the time picker.",
        defaultValue: "day",
        options: [
          {
            label: "Day",
            value: "day",
          },
          {
            label: "Hour",
            value: "hour",
          },
          {
            label: "Minute",
            value: "minute",
          },
          {
            label: "Second",
            value: "second",
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["day", "hour", "minute", "second"],
            default: "day",
          },
        },
      },
    ],
  },
  {
    sectionName: "Label",
    children: [
      {
        helpText: "Sets the label text of the date picker widget",
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
    sectionName: "Validations",
    children: [
      {
        propertyName: "isRequired",
        label: "Required",
        helpText: "Makes input to the widget mandatory",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "minDate",
        label: "Minimum Date",
        helpText: "Sets the minimum date that can be selected",
        controlType: "DATE_PICKER",
        placeholderText: "Enter Minimum Date",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.DATE_ISO_STRING },
      },
      {
        propertyName: "maxDate",
        label: "Maximum Date",
        helpText: "Sets the maximum date that can be selected",
        controlType: "DATE_PICKER",
        placeholderText: "Enter Maximum Date",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.DATE_ISO_STRING },
      },
    ],
  },
  {
    sectionName: "General",
    children: [
      {
        helpText: "Shows help text or details about the current input",
        propertyName: "labelTooltip",
        label: "Tooltip",
        controlType: "INPUT_TEXT",
        placeholderText: "",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
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
        propertyName: "isDisabled",
        label: "Disabled",
        helpText: "Disables input to this widget",
        controlType: "SWITCH",
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
    sectionName: "Events",
    children: [
      {
        propertyName: "onDateSelected",
        label: "onDateSelected",
        helpText: "when a date is selected in the calendar",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
] as PropertyPaneConfig[];
