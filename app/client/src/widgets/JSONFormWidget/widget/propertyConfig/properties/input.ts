import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { CurrencyDropdownOptions } from "widgets/CurrencyInputWidget/component/CurrencyCodeDropdown";
import { FieldType, INPUT_TYPES } from "widgets/JSONFormWidget/constants";
import {
  getAutocompleteProperties,
  getSchemaItem,
  HiddenFnParams,
} from "../helper";
import { InputFieldProps } from "widgets/JSONFormWidget/fields/InputField";
import { ISDCodeDropdownOptions } from "widgets/PhoneInputWidget/component/ISDCodeDropdown";
import { JSONFormWidgetProps } from "../..";
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
  if (fieldType === "Number Input" || fieldType === "Currency Input") {
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

export function minValueValidation(
  min: any,
  props: JSONFormWidgetProps,
  lodash: any,
  _: any,
  propertyPath: string,
) {
  const propertyPathChunks = propertyPath.split(".");
  const parentPath = propertyPathChunks.slice(0, -1).join(".");
  const schemaItem = lodash.get(props, parentPath);
  const max = schemaItem.maxNum;
  const value = min;
  min = Number(min);

  if (lodash?.isNil(value) || value === "") {
    return {
      isValid: true,
      parsed: undefined,
      messages: [""],
    };
  } else if (!Number.isFinite(min)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be number"],
    };
  } else if (max !== undefined && min >= max) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be lesser than max value"],
    };
  } else {
    return {
      isValid: true,
      parsed: min,
      messages: [""],
    };
  }
}

export function maxValueValidation(
  max: any,
  props: JSONFormWidgetProps,
  lodash: any,
  _: any,
  propertyPath: string,
) {
  const propertyPathChunks = propertyPath.split(".");
  const parentPath = propertyPathChunks.slice(0, -1).join(".");
  const schemaItem = lodash.get(props, parentPath);
  const min = schemaItem.minNum;
  const value = max;
  max = Number(max);

  if (lodash?.isNil(value) || value === "") {
    return {
      isValid: true,
      parsed: undefined,
      messages: [""],
    };
  } else if (!Number.isFinite(max)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be number"],
    };
  } else if (min !== undefined && max <= min) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be greater than min value"],
    };
  } else {
    return {
      isValid: true,
      parsed: Number(max),
      messages: [""],
    };
  }
}

const PROPERTIES = {
  general: [
    {
      helpText:
        "Sets the default text of the field. The text is updated if the default text changes",
      propertyName: "defaultValue",
      label: "Default Value",
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
      dependencies: ["schema"],
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
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.CURRENCY_INPUT),
      dependencies: ["schema"],
    },
    {
      helpText: "Changes the type of currency",
      propertyName: "currencyCountryCode",
      label: "Currency",
      enableSearch: true,
      dropdownHeight: "195px",
      controlType: "DROP_DOWN",
      searchPlaceholderText: "Search by code or name",
      options: CurrencyDropdownOptions,
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.CURRENCY_INPUT),
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
          label: "0",
          value: 0,
        },
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
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.CURRENCY_INPUT),
      dependencies: ["schema"],
      isBindProperty: false,
      isTriggerProperty: false,
    },
    {
      propertyName: "allowDialCodeChange",
      label: "Allow country code change",
      helpText: "Search by country",
      controlType: "SWITCH",
      isJSConvertible: false,
      isBindProperty: true,
      isTriggerProperty: false,
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(
          FieldType.PHONE_NUMBER_INPUT,
        ),
      dependencies: ["schema"],
      validation: { type: ValidationTypes.BOOLEAN },
    },
    {
      helpText: "Changes the country code",
      propertyName: "dialCode",
      label: "Default Country Code",
      enableSearch: true,
      dropdownHeight: "195px",
      controlType: "DROP_DOWN",
      searchPlaceholderText: "Search by code or country name",
      options: ISDCodeDropdownOptions,
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(
          FieldType.PHONE_NUMBER_INPUT,
        ),
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
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.TEXT_INPUT),
      dependencies: ["schema"],
    },
    {
      helpText: "Sets the minimum allowed value",
      propertyName: "minNum",
      label: "Min",
      controlType: "INPUT_TEXT",
      placeholderText: "1",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.FUNCTION,
        params: {
          fn: minValueValidation,
          expected: {
            type: "number",
            example: `1`,
            autocompleteDataType: AutocompleteDataType.NUMBER,
          },
        },
      },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.NUMBER_INPUT),
      dependencies: ["schema"],
    },
    {
      helpText: "Sets the maximum allowed value",
      propertyName: "maxNum",
      label: "Max",
      controlType: "INPUT_TEXT",
      placeholderText: "100",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.FUNCTION,
        params: {
          fn: maxValueValidation,
          expected: {
            type: "number",
            example: `100`,
            autocompleteDataType: AutocompleteDataType.NUMBER,
          },
        },
      },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.NUMBER_INPUT),
      dependencies: ["schema"],
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
      dependencies: ["schema"],
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
      dependencies: ["schema"],
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
      dependencies: ["schema"],
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
      dependencies: ["schema"],
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
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.TEXT_INPUT),
      dependencies: ["schema"],
    },
    {
      propertyName: "iconName",
      label: "Icon",
      helpText: "Sets the icon to be used in input field",
      controlType: "ICON_SELECT",
      isBindProperty: false,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotIncludes([
          FieldType.TEXT_INPUT,
          FieldType.EMAIL_INPUT,
          FieldType.PASSWORD_INPUT,
          FieldType.NUMBER_INPUT,
        ]),
      dependencies: ["schema"],
    },
    {
      propertyName: "iconAlign",
      label: "Icon alignment",
      helpText: "Sets the icon alignment of input field",
      controlType: "ICON_TABS",
      options: [
        {
          icon: "VERTICAL_LEFT",
          value: "left",
        },
        {
          icon: "VERTICAL_RIGHT",
          value: "right",
        },
      ],
      isBindProperty: false,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem<InputFieldProps["schemaItem"]>(...args).compute(
          (schemaItem) => !schemaItem.iconName,
        ),
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
      additionalAutoComplete: getAutocompleteProperties,
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES),
      dependencies: ["schema"],
    },
    {
      propertyName: "onEnterKeyPress",
      helpText: "Triggers an action on submit (when the enter key is pressed)",
      label: "onEnterKeyPress",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
      additionalAutoComplete: getAutocompleteProperties,
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES),
      dependencies: ["schema"],
    },
  ],
};

export default PROPERTIES;
