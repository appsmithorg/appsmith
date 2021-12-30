import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { CurrencyDropdownOptions } from "widgets/InputWidget/component/CurrencyCodeDropdown";
import { FieldType, INPUT_TYPES } from "widgets/JSONFormWidget/constants";
import { JSONFormWidgetProps } from "../..";
import { getSchemaItem, HiddenFnParams } from "../helper";
import { ISDCodeDropdownOptions } from "widgets/InputWidget/component/ISDCodeDropdown";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";

function defaultValueValidation(
  value: any,
  props: JSONFormWidgetProps,
  lodash: any,
  _: any,
  propertyPath: string,
): ValidationResponse {
  const propertyPathChunks = propertyPath.split(".");
  const parentPath = propertyPathChunks.slice(0, -1).join(".");
  const schemaItem = lodash.get(props, parentPath);
  const { fieldType } = schemaItem;

  if (value === null || value === undefined) {
    return {
      isValid: true,
      parsed: value,
      messages: [""],
    };
  }

  // Cannot use FieldType typing check as this whole method is passed as string and executed on worker, so it results
  // any methods/variable (closure) usage as reference error.
  // CAUTION! - make sure the correct fieldType is used here as string.
  if (
    fieldType === "Number" ||
    fieldType === "Currency" ||
    fieldType === "Phone Number"
  ) {
    const parsed = Number(value);

    if (typeof value === "string") {
      if (value.trim() === "") {
        return {
          isValid: true,
          parsed: undefined,
          messages: [""],
        };
      }

      if (!Number.isFinite(parsed)) {
        return {
          isValid: false,
          parsed: undefined,
          messages: ["This value must be a number"],
        };
      }
    }

    return {
      isValid: true,
      parsed,
      messages: [""],
    };
  }

  if (lodash.isObject(value)) {
    return {
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: ["This value must be string"],
    };
  }

  let parsed = value;
  const isValid = lodash.isString(parsed);
  if (!isValid) {
    try {
      parsed = lodash.toString(parsed);
    } catch (e) {
      return {
        isValid: false,
        parsed: "",
        messages: ["This value must be string"],
      };
    }
  }

  return {
    isValid,
    parsed: parsed,
    messages: [""],
  };
}

const PROPERTIES = {
  general: [
    {
      helpText:
        "Sets the default text of the field. The text is updated if the default text changes",
      propertyName: "defaultValue",
      label: "Default Text",
      controlType: "JSON_FORM_COMPUTE_VALUE",
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
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES),
      dependencies: ["schema", "sourceData"],
    },
    {
      propertyName: "allowCurrencyChange",
      label: "Allow currency change",
      helpText: "Search by currency or country",
      controlType: "SWITCH",
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
      controlType: "JSON_FORM_COMPUTE_VALUE",
      placeholderText: "255",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.NUMBER },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.TEXT),
      dependencies: ["schema", "sourceData"],
    },
    {
      helpText:
        "Adds a validation to the input which displays an error on failure",
      propertyName: "regex",
      label: "Regex",
      controlType: "JSON_FORM_COMPUTE_VALUE",
      placeholderText: "^\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}$",
      inputType: "TEXT",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.REGEX },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES),
      dependencies: ["schema", "sourceData"],
    },
    {
      helpText: "Sets the input validity based on a JS expression",
      propertyName: "validation",
      label: "Valid",
      controlType: "JSON_FORM_COMPUTE_VALUE",
      placeholderText: "{{ Input1.text.length > 0 }}",
      inputType: "TEXT",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN, params: { default: true } },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES),
      dependencies: ["schema", "sourceData"],
    },
    {
      helpText:
        "The error message to display if the regex or valid property check fails",
      propertyName: "errorMessage",
      label: "Error Message",
      controlType: "JSON_FORM_COMPUTE_VALUE",
      placeholderText: "Not a valid email!",
      inputType: "TEXT",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES),
      dependencies: ["schema", "sourceData"],
    },
    {
      helpText: "Sets a placeholder text for the input",
      propertyName: "placeholderText",
      label: "Placeholder",
      controlType: "JSON_FORM_COMPUTE_VALUE",
      placeholderText: "Placeholder",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES),
      dependencies: ["schema", "sourceData"],
    },
    {
      propertyName: "isSpellCheck",
      label: "Spellcheck",
      helpText:
        "Defines whether the text input may be checked for spelling errors",
      controlType: "SWITCH",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.TEXT),
      dependencies: ["schema"],
    },
  ],
  actions: [
    {
      propertyName: "onTextChanged",
      helpText: "Triggers an action when the text is changed",
      label: "onTextChanged",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES),
      dependencies: ["schema", "sourceData"],
    },
    {
      propertyName: "onEnterKeyPress",
      helpText: "Triggers an action on submit (when the enter key is pressed)",
      label: "onEnterKeyPress",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES),
      dependencies: ["schema", "sourceData"],
    },
  ],
};

export default PROPERTIES;
