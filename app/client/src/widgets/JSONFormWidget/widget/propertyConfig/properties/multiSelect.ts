import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { FieldType } from "widgets/JSONFormWidget/constants";
import { HiddenFnParams, getSchemaItem } from "../helper";
import { MultiSelectFieldProps } from "widgets/JSONFormWidget/fields/MultiSelectField";
import { ValidationTypes } from "constants/WidgetValidation";

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
        type: ValidationTypes.ARRAY,
        params: {
          unique: ["value"],
          children: {
            type: ValidationTypes.OBJECT,
            params: {
              required: true,
              allowedKeys: [
                {
                  name: "label",
                  type: ValidationTypes.TEXT,
                  params: {
                    default: "",
                    requiredKey: true,
                  },
                },
                {
                  name: "value",
                  type: ValidationTypes.TEXT,
                  params: {
                    default: "",
                    requiredKey: true,
                  },
                },
              ],
            },
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
      label: "Server Side Filtering",
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
      label: "Allow Select All",
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
      helpText: "Triggers an action when a user selects an option",
      label: "onOptionChange",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
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
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      dependencies: ["schema"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem<MultiSelectFieldProps["schemaItem"]>(...args).then(
          (schemaItem) => {
            if (schemaItem.fieldType !== FieldType.MULTISELECT) return true;
            return !schemaItem.serverSideFiltering;
          },
        ),
    },
  ],
};

export default PROPERTIES;
