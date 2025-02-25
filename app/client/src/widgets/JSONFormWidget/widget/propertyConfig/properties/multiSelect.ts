import { EvaluationSubstitutionType } from "ee/entities/DataTree/types";
import { FieldType } from "widgets/JSONFormWidget/constants";
import type { HiddenFnParams } from "../helper";
import { getSchemaItem, getAutocompleteProperties } from "../helper";
import type { MultiSelectFieldProps } from "widgets/JSONFormWidget/fields/MultiSelectField";
import type { ValidationResponse } from "constants/WidgetValidation";
import { ValidationTypes } from "constants/WidgetValidation";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { JSONFormWidgetProps } from "../..";

export function defaultOptionValueValidation(
  inputValue: unknown,
  props: JSONFormWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _: any,
): ValidationResponse {
  const DEFAULT_ERROR_MESSAGE = {
    name: "TypeError",
    message:
      "value should match: Array<string | number> | Array<{label: string, value: string | number}>",
  };
  const UNIQUE_ERROR_MESSAGE = {
    name: "ValidationError",
    message: "value must be unique. Duplicate values found",
  };

  const hasUniqueValues = (arr: unknown[]) => {
    const uniqueValues = new Set(arr);

    return uniqueValues.size === arr.length;
  };

  const hasLabelValueProperties = (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj: any,
  ): obj is { value: string | number; label: string } => {
    return (
      _.isPlainObject(obj) &&
      obj.hasOwnProperty("label") &&
      obj.hasOwnProperty("value") &&
      _.isString(obj.label) &&
      (_.isString(obj.value) || _.isFinite(obj.value))
    );
  };

  // When value is "['green', 'red']", "[{label: 'green', value: 'green'}]" and "green, red"
  const convertToArray = (value: unknown): unknown[] => {
    if (typeof value === "string" && value.trim() !== "") {
      try {
        const parsedValue = JSON.parse(value as string);

        if (Array.isArray(parsedValue)) return parsedValue;
      } catch (e) {
        return value.split(",").map((s) => s.trim());
      }
    }

    if (Array.isArray(value)) return value;

    return [];
  };

  // If input value is empty string then we can fairly assume that the input
  // was cleared out and can be treated as undefined.
  if (inputValue === undefined || inputValue === null || inputValue === "") {
    const parsed = inputValue === "" ? undefined : inputValue;

    return {
      isValid: true,
      parsed,
      messages: [{ name: "", message: "" }],
    };
  }

  const values = convertToArray(inputValue);

  // If there is inputValue but was not converted to proper array
  // or the input value is not string and not an array then error is returned
  if (
    (typeof inputValue === "string" &&
      inputValue.trim() !== "" &&
      !values.length) ||
    (typeof inputValue !== "string" && !Array.isArray(inputValue))
  ) {
    return {
      isValid: false,
      parsed: [],
      messages: [DEFAULT_ERROR_MESSAGE],
    };
  }

  // When value is ["green", "red"]
  if (values.every((val) => _.isString(val) || _.isFinite(val))) {
    if (!hasUniqueValues(values)) {
      return {
        isValid: false,
        parsed: [],
        messages: [UNIQUE_ERROR_MESSAGE],
      };
    }
    // When value is [{label: "green", value: "red"}]
  } else if (values.every(hasLabelValueProperties)) {
    if (!hasUniqueValues(values.map((val) => val.value))) {
      return {
        isValid: false,
        parsed: [],
        messages: [UNIQUE_ERROR_MESSAGE],
      };
    }
  } else {
    // When value is [true, false], [undefined, undefined] etc.
    return {
      isValid: false,
      parsed: [],
      messages: [DEFAULT_ERROR_MESSAGE],
    };
  }

  return {
    isValid: true,
    parsed: values,
    messages: [{ name: "", message: "" }],
  };
}

const PROPERTIES = {
  general: [
    {
      propertyName: "defaultValue",
      helpText: "Selects the option with value by default",
      label: "Default value",
      controlType: "JSON_FORM_COMPUTE_VALUE",
      placeholderText: "[GREEN]",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.FUNCTION,
        params: {
          fn: defaultOptionValueValidation,
          expected: {
            type: "Array of values",
            example: `['option1', 'option2'] | [{ "label": "label1", "value": "value1" }]`,
            autocompleteDataType: AutocompleteDataType.ARRAY,
          },
        },
      },
      evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      dependencies: ["schema", "sourceData"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTISELECT),
    },
    {
      propertyName: "placeholderText",
      helpText: "Sets a Placeholder text",
      label: "Placeholder",
      controlType: "JSON_FORM_COMPUTE_VALUE",
      placeholderText: "Search",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
      dependencies: ["schema"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTISELECT),
    },
    {
      propertyName: "isFilterable",
      label: "Filterable",
      helpText: "Makes the dropdown list filterable",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
      dependencies: ["schema"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTISELECT),
    },
    {
      propertyName: "serverSideFiltering",
      helpText: "Enables server side filtering of the data",
      label: "Server side filtering",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      validation: { type: ValidationTypes.BOOLEAN },
      dependencies: ["schema"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTISELECT),
    },
    {
      propertyName: "allowSelectAll",
      helpText: "Controls the visibility of select all option in dropdown.",
      label: "Allow select all",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
      dependencies: ["schema"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTISELECT),
    },
  ],
  actions: [
    {
      propertyName: "onOptionChange",
      helpText: "when a user selects an option",
      label: "onOptionChange",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
      additionalAutoComplete: getAutocompleteProperties,
      dependencies: ["schema"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTISELECT),
    },
    {
      helpText: "Trigger an action on change of filterText",
      propertyName: "onFilterUpdate",
      label: "onFilterUpdate",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
      additionalAutoComplete: getAutocompleteProperties,
      dependencies: ["schema"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem<MultiSelectFieldProps["schemaItem"]>(...args).compute(
          (schemaItem) => {
            if (schemaItem.fieldType !== FieldType.MULTISELECT) return true;

            return !schemaItem.serverSideFiltering;
          },
        ),
    },
  ],
  content: {
    data: [
      {
        propertyName: "defaultValue",
        helpText: "Selects the option with value by default",
        label: "Default selected values",
        controlType: "JSON_FORM_COMPUTE_VALUE",
        placeholderText: "[GREEN]",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: defaultOptionValueValidation,
            expected: {
              type: "Array of values",
              example: `['option1', 'option2'] | [{ "label": "label1", "value": "value1" }]`,
              autocompleteDataType: AutocompleteDataType.ARRAY,
            },
          },
        },
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        dependencies: ["schema", "sourceData"],
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTISELECT),
      },
    ],
    general: [
      {
        propertyName: "placeholderText",
        helpText: "Sets a Placeholder text",
        label: "Placeholder",
        controlType: "JSON_FORM_COMPUTE_VALUE",
        placeholderText: "Search",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        dependencies: ["schema"],
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTISELECT),
      },
    ],
    toggles: [
      {
        propertyName: "allowSelectAll",
        helpText: "Controls the visibility of select all option in dropdown.",
        label: "Allow select all",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
        dependencies: ["schema"],
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTISELECT),
      },
    ],
    events: [
      {
        propertyName: "onOptionChange",
        helpText: "when a user selects an option",
        label: "onOptionChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        additionalAutoComplete: getAutocompleteProperties,
        dependencies: ["schema"],
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTISELECT),
      },
    ],
    searchAndFilters: [
      {
        propertyName: "isFilterable",
        label: "Allow searching",
        helpText: "Makes the dropdown list filterable",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
        dependencies: ["schema"],
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTISELECT),
      },
      {
        propertyName: "serverSideFiltering",
        helpText: "Enables server side filtering of the data",
        label: "Server side filtering",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        customJSControl: "JSON_FORM_COMPUTE_VALUE",
        validation: { type: ValidationTypes.BOOLEAN },
        dependencies: ["schema"],
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTISELECT),
      },
      {
        helpText: "Trigger an action on change of filterText",
        propertyName: "onFilterUpdate",
        label: "onFilterUpdate",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        additionalAutoComplete: getAutocompleteProperties,
        dependencies: ["schema"],
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem<MultiSelectFieldProps["schemaItem"]>(...args).compute(
            (schemaItem) => {
              if (schemaItem.fieldType !== FieldType.MULTISELECT) return true;

              return !schemaItem.serverSideFiltering;
            },
          ),
      },
    ],
  },
};

export default PROPERTIES;
