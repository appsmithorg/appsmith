import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { FieldType } from "widgets/FormBuilderWidget/constants";
import { SelectFieldProps } from "widgets/FormBuilderWidget/fields/SelectField";
import { HiddenFnParams, getSchemaItem } from "../helper";

function defaultValueValidation(value: unknown): ValidationResponse {
  if (typeof value === "string") return { isValid: true, parsed: value.trim() };
  if (value === undefined || value === null)
    return {
      isValid: false,
      parsed: "",
      messages: ["This value does not evaluate to type: string"],
    };
  return { isValid: true, parsed: value };
}

const PROPERTIES = {
  general: [
    {
      propertyName: "defaultValue",
      helpText: "Selects the option with value by default",
      label: "Default Value",
      controlType: "INPUT_TEXT",
      placeholderText: "GREEN",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.FUNCTION,
        params: {
          fn: defaultValueValidation,
          expected: {
            type: "value or Array of values",
            example: `option1 | ['option1', 'option2']`,
            autocompleteDataType: AutocompleteDataType.STRING,
          },
        },
      },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.SELECT),
      dependencies: ["schema"],
    },
    {
      propertyName: "placeholderText",
      label: "Placeholder",
      controlType: "INPUT_TEXT",
      placeholderText: "Enter placeholder text",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.SELECT),
      dependencies: ["schema"],
    },
    {
      propertyName: "isFilterable",
      label: "Filterable",
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
  ],
  actions: [
    {
      propertyName: "onOptionChange",
      helpText: "Triggers an action when a user selects an option",
      label: "onOptionChange",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
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
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem<SelectFieldProps["schemaItem"]>(...args).then(
          (schemaItem) => {
            return (
              schemaItem.fieldType !== FieldType.SELECT &&
              !schemaItem.serverSideFiltering
            );
          },
        ),
    },
  ],
};

export default PROPERTIES;
