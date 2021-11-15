import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { FieldType } from "widgets/FormBuilderWidget/constants";
import { MultiSelectFieldProps } from "widgets/FormBuilderWidget/fields/MultiSelectField";
import { HiddenFnParams, getSchemaItem } from "../helper";

function defaultOptionValueValidation(value: unknown): ValidationResponse {
  let values: string[] = [];
  if (typeof value === "string") {
    try {
      values = JSON.parse(value);
      if (!Array.isArray(values)) {
        throw new Error();
      }
    } catch {
      values = value.length ? value.split(",") : [];
      if (values.length > 0) {
        values = values.map((_v: string) => _v.trim());
      }
    }
  }
  if (Array.isArray(value)) {
    values = Array.from(new Set(value));
  }

  return {
    isValid: true,
    parsed: values,
  };
}

const PROPERTIES = {
  general: [
    {
      propertyName: "defaultValue",
      helpText: "Selects the option with value by default",
      label: "Default Value",
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
            example: `['option1', 'option2']`,
            autocompleteDataType: AutocompleteDataType.ARRAY,
          },
        },
      },
      dependencies: ["schema", "sourceData"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTI_SELECT),
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
      dependencies: ["schema", "sourceData"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTI_SELECT),
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
      dependencies: ["schema", "sourceData"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTI_SELECT),
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
      dependencies: ["schema", "sourceData"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.MULTI_SELECT),
    },
    {
      helpText: "Trigger an action on change of filterText",
      propertyName: "onFilterUpdate",
      label: "onFilterUpdate",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      dependencies: ["schema", "sourceData"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem<MultiSelectFieldProps["schemaItem"]>(...args).then(
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
