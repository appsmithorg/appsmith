import { FieldType } from "widgets/JSONFormWidget/constants";
import type { HiddenFnParams } from "../helper";
import { getSchemaItem, getAutocompleteProperties } from "../helper";
import type { JSONFormWidgetProps } from "../..";
import type { SelectFieldProps } from "widgets/JSONFormWidget/fields/SelectField";
import type { ValidationResponse } from "constants/WidgetValidation";
import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";

export function defaultOptionValueValidation(
  value: unknown,
  props: JSONFormWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _: any,
): ValidationResponse {
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

  // If input value is empty string then we can fairly assume that the input
  // was cleared out and can be treated as undefined.
  if (value === undefined || value === null || value === "") {
    return {
      isValid: true,
      parsed: value,
      messages: [{ name: "", message: "" }],
    };
  }

  if (typeof value === "string") {
    try {
      const parsedValue = JSON.parse(value);

      if (_.isObject(parsedValue)) {
        value = parsedValue;
      }
    } catch (e) {}
  }

  if (
    _.isString(value) ||
    _.isFinite(value) ||
    hasLabelValueProperties(value)
  ) {
    // When value is "", "green", 444
    return {
      isValid: true,
      parsed: value,
      messages: [{ name: "", message: "" }],
    };
  }

  return {
    isValid: false,
    parsed: {},
    messages: [
      {
        name: "TypeError",
        message:
          'value should match: string | { "label": "label1", "value": "value1" }',
      },
    ],
  };
}

const PROPERTIES = {
  content: {
    data: [
      {
        propertyName: "defaultValue",
        helpText: "Selects the option with value by default",
        label: "Default selected value",
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
        helpText: "Sets a placeholder text",
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
        helpText: "when a user selects an option",
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
        label: "Allow searching",
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
        label: "Server side filtering",
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
