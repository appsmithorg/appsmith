import moment from "moment";

import { ValidationTypes } from "constants/WidgetValidation";
import { FieldType } from "widgets/JSONFormWidget/constants";
import {
  HiddenFnParams,
  getSchemaItem,
  getAutocompleteProperties,
} from "../helper";
import { TimePrecision } from "widgets/DatePickerWidget2/constants";

export const dateFormatOptions = [
  {
    label: moment().format("YYYY-MM-DDTHH:mm:ss.sssZ"),
    subText: "ISO 8601",
    value: "YYYY-MM-DDTHH:mm:ss.sssZ",
  },
  {
    label: moment().format("LLL"),
    subText: "LLL",
    value: "LLL",
  },
  {
    label: moment().format("LL"),
    subText: "LL",
    value: "LL",
  },
  {
    label: moment().format("YYYY-MM-DD HH:mm"),
    subText: "YYYY-MM-DD HH:mm",
    value: "YYYY-MM-DD HH:mm",
  },
  {
    label: moment().format("YYYY-MM-DDTHH:mm:ss"),
    subText: "YYYY-MM-DDTHH:mm:ss",
    value: "YYYY-MM-DDTHH:mm:ss",
  },
  {
    label: moment().format("YYYY-MM-DD hh:mm:ss A"),
    subText: "YYYY-MM-DD hh:mm:ss A",
    value: "YYYY-MM-DD hh:mm:ss A",
  },
  {
    label: moment().format("DD/MM/YYYY HH:mm"),
    subText: "DD/MM/YYYY HH:mm",
    value: "DD/MM/YYYY HH:mm",
  },
  {
    label: moment().format("D MMMM, YYYY"),
    subText: "D MMMM, YYYY",
    value: "D MMMM, YYYY",
  },
  {
    label: moment().format("H:mm A D MMMM, YYYY"),
    subText: "H:mm A D MMMM, YYYY",
    value: "H:mm A D MMMM, YYYY",
  },
  {
    label: moment().format("YYYY-MM-DD"),
    subText: "YYYY-MM-DD",
    value: "YYYY-MM-DD",
  },
  {
    label: moment().format("MM-DD-YYYY"),
    subText: "MM-DD-YYYY",
    value: "MM-DD-YYYY",
  },
  {
    label: moment().format("DD-MM-YYYY"),
    subText: "DD-MM-YYYY",
    value: "DD-MM-YYYY",
  },
  {
    label: moment().format("MM/DD/YYYY"),
    subText: "MM/DD/YYYY",
    value: "MM/DD/YYYY",
  },
  {
    label: moment().format("DD/MM/YYYY"),
    subText: "DD/MM/YYYY",
    value: "DD/MM/YYYY",
  },
  {
    label: moment().format("DD/MM/YY"),
    subText: "DD/MM/YY",
    value: "DD/MM/YY",
  },
  {
    label: moment().format("MM/DD/YY"),
    subText: "MM/DD/YY",
    value: "MM/DD/YY",
  },
];

const PROPERTIES = {
  general: [
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
      propertyName: "timePrecision",
      label: "Time precision",
      controlType: "DROP_DOWN",
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
  actions: [
    {
      propertyName: "onDateSelected",
      label: "onDateSelected",
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
};

export default PROPERTIES;
