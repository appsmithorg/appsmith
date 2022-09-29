import { FieldType } from "widgets/JSONFormWidget/constants";
import {
  HiddenFnParams,
  getSchemaItem,
  getAutocompleteProperties,
} from "../helper";
import { JSONFormWidgetProps } from "../..";
import { SelectFieldProps } from "widgets/JSONFormWidget/fields/SelectField";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

export function defaultOptionValueValidation(
  inputValue: unknown,
  props: JSONFormWidgetProps,
  _: any,
): ValidationResponse {
  const DEFAULT_ERROR_MESSAGE =
    'value should match: string | { "label": "label1", "value": "value1" }';
  let value = inputValue;

  const hasLabelValueProperties = (
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

  // If input value is empty string then we can fairly assume that the input
  // was cleared out and can be treated as undefined.
  if (inputValue === undefined || inputValue === null || inputValue === "") {
    return {
      isValid: true,
      parsed: inputValue,
      messages: [""],
    };
  }

  if (typeof inputValue === "string") {
    try {
      value = JSON.parse(inputValue);
    } catch (e) {}
  }

  if (_.isString(value) || _.isFinite(value)) {
    // When value is "", "green", 444
    return {
      isValid: true,
      parsed: value,
      messages: [""],
    };
  }

  if (hasLabelValueProperties(value)) {
    // When value is {label: "green", value: "green"}
    return {
      isValid: true,
      parsed: value,
      messages: [""],
    };
  }

  return {
    isValid: false,
    parsed: {},
    messages: [DEFAULT_ERROR_MESSAGE],
  };
}

const PROPERTIES = {
  content: {
    data: [
      {
        propertyName: "defaultValue",
        helpText: "Selects the option with value by default",
        label: "Default Selected Value",
        controlType: "JSON_FORM_COMPUTE_VALUE",
        placeholderText: '{ "label": "Option1", "value": "Option2" }',
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: defaultOptionValueValidation,
            expected: {
              type: 'value1 or { "label": "label1", "value": "value1" }',
              example: `value1 | { "label": "label1", "value": "value1" }`,
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.SELECT),
        dependencies: ["schema"],
      },
    ],
    general: [
      {
        propertyName: "placeholderText",
        label: "Placeholder",
        controlType: "JSON_FORM_COMPUTE_VALUE",
        placeholderText: "Enter placeholder text",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.SELECT),
        dependencies: ["schema"],
      },
    ],
    events: [
      {
        propertyName: "onOptionChange",
        helpText: "Triggers an action when a user selects an option",
        label: "onOptionChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        additionalAutoComplete: getAutocompleteProperties,
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.SELECT),
        dependencies: ["schema", "sourceData"],
      },
    ],
    searchAndFilters: [
      {
        propertyName: "isFilterable",
        label: "Allow Searching",
        helpText: "Makes the dropdown list filterable",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        customJSControl: "JSON_FORM_COMPUTE_VALUE",
        validation: { type: ValidationTypes.BOOLEAN },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.SELECT),
        dependencies: ["schema", "sourceData"],
      },
      {
        propertyName: "serverSideFiltering",
        helpText: "Enables server side filtering of the data",
        label: "Server Side Filtering",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        customJSControl: "JSON_FORM_COMPUTE_VALUE",
        validation: { type: ValidationTypes.BOOLEAN },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.SELECT),
        dependencies: ["schema", "sourceData"],
      },
      {
        propertyName: "onFilterUpdate",
        helpText: "Trigger an action on change of filterText",
        label: "onFilterUpdate",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        dependencies: ["schema", "sourceData"],
        additionalAutoComplete: getAutocompleteProperties,
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem<SelectFieldProps["schemaItem"]>(...args).compute(
            (schemaItem) => {
              if (schemaItem.fieldType !== FieldType.SELECT) return true;
              return !schemaItem.serverSideFiltering;
            },
          ),
      },
    ],
  },
};

export default PROPERTIES;
