import { ValidationTypes } from "constants/WidgetValidation";
import { FieldType } from "widgets/JSONFormWidget/constants";
import {
  HiddenFnParams,
  getSchemaItem,
  getAutocompleteProperties,
} from "../helper";
import { TimePrecision } from "widgets/DatePickerWidget2/constants";
import { dateFormatOptions } from "widgets/constants";

const PROPERTIES = {
  content: {
    data: [
      {
        helpText: "Sets the format of the selected date",
        propertyName: "dateFormat",
        label: "Date Format",
        controlType: "DROP_DOWN",
        isJSConvertible: true,
        customJSControl: "JSON_FORM_COMPUTE_VALUE",
        optionWidth: "340px",
        options: dateFormatOptions,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        hideSubText: true,
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.DATEPICKER),
        dependencies: ["schema"],
      },
      {
        propertyName: "defaultValue",
        label: "Default Date",
        helpText:
          "Sets the default date of the widget. The date is updated if the default date changes",
        controlType: "DATE_PICKER",
        placeholderText: "Enter Default Date",
        useValidationMessage: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        customJSControl: "JSON_FORM_COMPUTE_VALUE",
        validation: { type: ValidationTypes.DATE_ISO_STRING },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.DATEPICKER),
        dependencies: ["schema"],
      },
      {
        propertyName: "timePrecision",
        label: "Time precision",
        controlType: "ICON_TABS",
        fullWidth: true,
        helpText: "Sets the different time picker or hide.",
        defaultValue: TimePrecision.MINUTE,
        options: [
          {
            label: "None",
            value: TimePrecision.NONE,
          },
          {
            label: "Minute",
            value: TimePrecision.MINUTE,
          },
          {
            label: "Second",
            value: TimePrecision.SECOND,
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              TimePrecision.NONE,
              TimePrecision.MINUTE,
              TimePrecision.SECOND,
            ],
            default: TimePrecision.MINUTE,
          },
        },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.DATEPICKER),
        dependencies: ["schema"],
      },
    ],
    validation: [
      {
        propertyName: "minDate",
        label: "Min Date",
        helpText: "Defines the min date for the field",
        controlType: "DATE_PICKER",
        useValidationMessage: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        customJSControl: "JSON_FORM_COMPUTE_VALUE",
        validation: { type: ValidationTypes.DATE_ISO_STRING },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.DATEPICKER),
        dependencies: ["schema"],
      },
      {
        propertyName: "maxDate",
        label: "Max Date",
        helpText: "Defines the max date for the field",
        controlType: "DATE_PICKER",
        useValidationMessage: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        customJSControl: "JSON_FORM_COMPUTE_VALUE",
        validation: { type: ValidationTypes.DATE_ISO_STRING },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.DATEPICKER),
        dependencies: ["schema"],
      },
    ],
    general: [
      {
        propertyName: "convertToISO",
        label: "Convert to ISO format",
        helpText:
          "Enabling this always converts the value in ISO form in the formData irrespective of the 'Date Format' selected",
        controlType: "SWITCH",
        isJSConvertible: false,
        isBindProperty: true,
        isTriggerProperty: false,
        customJSControl: "JSON_FORM_COMPUTE_VALUE",
        validation: { type: ValidationTypes.BOOLEAN },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.DATEPICKER),
        dependencies: ["schema"],
      },
      {
        propertyName: "shortcuts",
        label: "Show Shortcuts",
        helpText: "Choose to show shortcut menu",
        controlType: "SWITCH",
        isJSConvertible: false,
        isBindProperty: true,
        isTriggerProperty: false,
        customJSControl: "JSON_FORM_COMPUTE_VALUE",
        validation: { type: ValidationTypes.BOOLEAN },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.DATEPICKER),
        dependencies: ["schema"],
      },
      {
        propertyName: "closeOnSelection",
        label: "Close On Selection",
        helpText: "Calender should close when a date is selected",
        controlType: "SWITCH",
        isJSConvertible: false,
        isBindProperty: true,
        isTriggerProperty: false,
        customJSControl: "JSON_FORM_COMPUTE_VALUE",
        validation: { type: ValidationTypes.BOOLEAN },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.DATEPICKER),
        dependencies: ["schema"],
      },
    ],
    events: [
      {
        propertyName: "onDateSelected",
        label: "onDateSelected",
        helpText: "Triggers an action when a date is selected in the calendar",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        additionalAutoComplete: getAutocompleteProperties,
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.DATEPICKER),
        dependencies: ["schema"],
      },
    ],
  },
};

export default PROPERTIES;
