import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { CurrencyDropdownOptions } from "widgets/InputWidget/component/CurrencyCodeDropdown";
import { defaultValueValidation } from "widgets/InputWidget/widget";
import { getSchemaItem, HiddenFnParams } from "../helper";
import { FieldType, INPUT_TYPES } from "widgets/FormBuilderWidget/constants";
import { ISDCodeDropdownOptions } from "widgets/InputWidget/component/ISDCodeDropdown";
import { ValidationTypes } from "constants/WidgetValidation";

const INPUT_PROPERTIES = [
  {
    helpText:
      "Sets the default text of the field. The text is updated if the default text changes",
    propertyName: "defaultValue",
    label: "Default Text",
    controlType: "INPUT_TEXT",
    placeholderText: "John Doe",
    isBindProperty: true,
    isTriggerProperty: false,
    validation: {
      type: ValidationTypes.FUNCTION,
      params: {
        fn: defaultValueValidation,
        expected: {
          type: "string or number",
          example: `John | 123`,
          autocompleteDataType: AutocompleteDataType.STRING,
        },
      },
    },
    dependencies: ["schema"],
  },
  {
    propertyName: "allowCurrencyChange",
    label: "Allow currency change",
    helpText: "Search by currency or country",
    controlType: "SWITCH",
    isJSConvertible: false,
    isBindProperty: true,
    isTriggerProperty: false,
    validation: { type: ValidationTypes.BOOLEAN },
    hidden: (...args: HiddenFnParams) =>
      getSchemaItem(...args).fieldTypeNotMatches(FieldType.CURRENCY),
    dependencies: ["schema"],
  },
  {
    helpText: "Changes the country code",
    propertyName: "phoneNumberCountryCode",
    label: "Default Country Code",
    enableSearch: true,
    dropdownHeight: "195px",
    controlType: "DROP_DOWN",
    placeholderText: "Search by code or country name",
    options: ISDCodeDropdownOptions,
    hidden: (...args: HiddenFnParams) =>
      getSchemaItem(...args).fieldTypeNotMatches(FieldType.PHONE_NUMBER),
    dependencies: ["schema"],
    isBindProperty: false,
    isTriggerProperty: false,
  },
  {
    helpText: "Changes the type of currency",
    propertyName: "currencyCountryCode",
    label: "Currency",
    enableSearch: true,
    dropdownHeight: "195px",
    controlType: "DROP_DOWN",
    placeholderText: "Search by code or name",
    options: CurrencyDropdownOptions,
    hidden: (...args: HiddenFnParams) =>
      getSchemaItem(...args).fieldTypeNotMatches(FieldType.CURRENCY),
    dependencies: ["schema"],
    isBindProperty: false,
    isTriggerProperty: false,
  },
  {
    helpText: "No. of decimals in currency input",
    propertyName: "decimalsInCurrency",
    label: "Decimals",
    controlType: "DROP_DOWN",
    options: [
      {
        label: "1",
        value: 1,
      },
      {
        label: "2",
        value: 2,
      },
    ],
    hidden: (...args: HiddenFnParams) =>
      getSchemaItem(...args).fieldTypeNotMatches(FieldType.CURRENCY),
    dependencies: ["schema"],
    isBindProperty: false,
    isTriggerProperty: false,
  },
  {
    helpText: "Sets maximum allowed text length",
    propertyName: "maxChars",
    label: "Max Chars",
    controlType: "INPUT_TEXT",
    placeholderText: "255",
    isBindProperty: true,
    isTriggerProperty: false,
    validation: { type: ValidationTypes.NUMBER },
    hidden: (...args: HiddenFnParams) =>
      getSchemaItem(...args).fieldTypeNotMatches(FieldType.TEXT),
    dependencies: ["schema"],
  },
  {
    helpText:
      "Adds a validation to the input which displays an error on failure",
    propertyName: "regex",
    label: "Regex",
    controlType: "INPUT_TEXT",
    placeholderText: "^\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}$",
    inputType: "TEXT",
    isBindProperty: true,
    isTriggerProperty: false,
    validation: { type: ValidationTypes.REGEX },
    hidden: (...args: HiddenFnParams) =>
      getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES),
    dependencies: ["schema"],
  },
  {
    helpText: "Sets the input validity based on a JS expression",
    propertyName: "validation",
    label: "Valid",
    controlType: "INPUT_TEXT",
    placeholderText: "{{ Input1.text.length > 0 }}",
    inputType: "TEXT",
    isBindProperty: true,
    isTriggerProperty: false,
    validation: { type: ValidationTypes.BOOLEAN },
    hidden: (...args: HiddenFnParams) =>
      getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES),
    dependencies: ["schema"],
  },
  {
    helpText:
      "The error message to display if the regex or valid property check fails",
    propertyName: "errorMessage",
    label: "Error Message",
    controlType: "INPUT_TEXT",
    placeholderText: "Not a valid email!",
    inputType: "TEXT",
    isBindProperty: true,
    isTriggerProperty: false,
    validation: { type: ValidationTypes.TEXT },
    hidden: (...args: HiddenFnParams) =>
      getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES),
    dependencies: ["schema"],
  },
  {
    helpText: "Sets a placeholder text for the input",
    propertyName: "placeholderText",
    label: "Placeholder",
    controlType: "INPUT_TEXT",
    placeholderText: "Placeholder",
    isBindProperty: true,
    isTriggerProperty: false,
    validation: { type: ValidationTypes.TEXT },
    hidden: (...args: HiddenFnParams) =>
      getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES),
    dependencies: ["schema"],
  },
];

export default INPUT_PROPERTIES;
