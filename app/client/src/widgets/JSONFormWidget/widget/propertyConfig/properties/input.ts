import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import { CurrencyDropdownOptions } from "widgets/CurrencyInputWidget/component/CurrencyCodeDropdown";
import { FieldType, INPUT_TYPES } from "widgets/JSONFormWidget/constants";
import type { HiddenFnParams } from "../helper";
import { getAutocompleteProperties, getSchemaItem } from "../helper";
import type { InputFieldProps } from "widgets/JSONFormWidget/fields/InputField";
import { ISDCodeDropdownOptions } from "widgets/PhoneInputWidget/component/ISDCodeDropdown";
import type { JSONFormWidgetProps } from "../..";
import type { ValidationResponse } from "constants/WidgetValidation";
import { ValidationTypes } from "constants/WidgetValidation";
import { ICON_NAMES } from "WidgetProvider/constants";

function defaultValueValidation(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  props: JSONFormWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lodash: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      messages: [{ name: "", message: "" }],
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
          messages: [{ name: "", message: "" }],
        };
      }

      if (!Number.isFinite(parsed)) {
        return {
          isValid: false,
          parsed: undefined,
          messages: [
            {
              name: "TypeError",
              message: "This value must be a number",
            },
          ],
        };
      }
    }

    return {
      isValid: true,
      parsed,
      messages: [{ name: "", message: "" }],
    };
  }

  if (lodash.isObject(value)) {
    return {
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: [
        {
          name: "TypeError",
          message: "This value must be string",
        },
      ],
    };
  }

  let parsed = value;
  let isValid = lodash.isString(parsed);

  if (!isValid) {
    try {
      parsed = lodash.toString(parsed);
      isValid = true;
    } catch (e) {
      return {
        isValid: false,
        parsed: "",
        messages: [
          {
            name: "TypeError",
            message: "This value must be string",
          },
        ],
      };
    }
  }

  return {
    isValid,
    parsed: parsed,
    messages: [{ name: "", message: "" }],
  };
}

export function minValueValidation(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  min: any,
  props: JSONFormWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lodash: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      messages: [{ name: "", message: "" }],
    };
  } else if (!Number.isFinite(min)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: [
        {
          name: "TypeError",
          message: "This value must be number",
        },
      ],
    };
  } else if (max !== undefined && min >= max) {
    return {
      isValid: false,
      parsed: undefined,
      messages: [
        {
          name: "RangeError",
          message: "This value must be lesser than max value",
        },
      ],
    };
  } else {
    return {
      isValid: true,
      parsed: min,
      messages: [{ name: "", message: "" }],
    };
  }
}

export function maxValueValidation(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  max: any,
  props: JSONFormWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lodash: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      messages: [{ name: "", message: "" }],
    };
  } else if (!Number.isFinite(max)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: [
        {
          name: "TypeError",
          message: "This value must be number",
        },
      ],
    };
  } else if (min !== undefined && max <= min) {
    return {
      isValid: false,
      parsed: undefined,
      messages: [
        {
          name: "RangeError",
          message: "This value must be greater than min value",
        },
      ],
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
  content: {
    data: [
      {
        propertyName: "defaultValue",
        helpText:
          "Sets the default text of the field. The text is updated if the default text changes",
        label: "Default value",
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
          getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES) ||
          getSchemaItem(...args).fieldTypeMatches(FieldType.PHONE_NUMBER_INPUT),
        dependencies: ["schema"],
      },
      {
        helpText:
          "Sets the default text of the widget. The text is updated if the default text changes",
        propertyName: "defaultValue",
        label: "Default value",
        controlType: "JSON_FORM_COMPUTE_VALUE",
        placeholderText: "(000) 000-0000",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: defaultValueValidation,
            expected: {
              type: "string",
              example: `(000) 000-0000`,
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(
            FieldType.PHONE_NUMBER_INPUT,
          ),
        dependencies: ["schema"],
      },
      {
        propertyName: "dialCode",
        helpText: "Changes the country code",
        label: "Default country code",
        enableSearch: true,
        dropdownHeight: "195px",
        controlType: "DROP_DOWN",
        virtual: true,
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
        propertyName: "currencyCountryCode",
        helpText: "Changes the type of currency",
        label: "Currency",
        enableSearch: true,
        dropdownHeight: "195px",
        controlType: "DROP_DOWN",
        virtual: true,
        searchPlaceholderText: "Search by code or name",
        options: CurrencyDropdownOptions,
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.CURRENCY_INPUT),
        dependencies: ["schema"],
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "allowDialCodeChange",
        label: "Allow Country Code Change",
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
        propertyName: "decimalsInCurrency",
        helpText: "No. of decimals in currency input",
        label: "Decimals allowed",
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
          {
            label: "3",
            value: 3,
          },
          {
            label: "4",
            value: 4,
          },
          {
            label: "5",
            value: 5,
          },
          {
            label: "6",
            value: 6,
          },
        ],
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.CURRENCY_INPUT),
        dependencies: ["schema"],
        isBindProperty: false,
        isTriggerProperty: false,
      },
    ],
    general: [
      {
        propertyName: "placeholderText",
        helpText: "Sets a placeholder text for the input",
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
    ],
    validation: [
      {
        propertyName: "isRequired",
        label: "Required",
        helpText: "Makes input to the widget mandatory",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        customJSControl: "JSON_FORM_COMPUTE_VALUE",
        validation: { type: ValidationTypes.BOOLEAN },
        hidden: (...args: HiddenFnParams) => {
          return getSchemaItem(...args).compute(
            (schemaItem) =>
              schemaItem.fieldType === FieldType.OBJECT ||
              schemaItem.fieldType === FieldType.ARRAY,
          );
        },
        dependencies: ["schema", "sourceData"],
      },
      {
        propertyName: "maxChars",
        helpText: "Sets maximum allowed text length",
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
        propertyName: "minNum",
        helpText: "Sets the minimum allowed value",
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
        propertyName: "maxNum",
        helpText: "Sets the maximum allowed value",
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
        propertyName: "regex",
        helpText:
          "Adds a validation to the input which displays an error on failure",
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
        propertyName: "validation",
        helpText: "Sets the input validity based on a JS expression",
        label: "Valid",
        controlType: "JSON_FORM_COMPUTE_VALUE",
        placeholderText: "{{ Input1.text.length > 0 }}",
        inputType: "TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.BOOLEAN,
          params: { default: true },
        },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotIncludes(INPUT_TYPES),
        dependencies: ["schema"],
      },
      {
        propertyName: "errorMessage",
        helpText:
          "The error message to display if the regex or valid property check fails",
        label: "Error message",
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
    ],
    events: [
      {
        propertyName: "onTextChanged",
        helpText: "when the text is changed",
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
        helpText: "on submit (when the enter key is pressed)",
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
  },
  style: {
    icon: [
      {
        propertyName: "iconName",
        label: "Icon",
        helpText: "Sets the icon to be used in input field",
        controlType: "ICON_SELECT",
        isBindProperty: true,
        isTriggerProperty: false,
        isJSConvertible: true,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ICON_NAMES,
          },
        },
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
        label: "Position",
        helpText: "Sets the icon position of input field",
        controlType: "ICON_TABS",
        defaultValue: "left",
        fullWidth: false,
        options: [
          {
            startIcon: "skip-left-line",
            value: "left",
          },
          {
            startIcon: "skip-right-line",
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
  },
};

export default PROPERTIES;
