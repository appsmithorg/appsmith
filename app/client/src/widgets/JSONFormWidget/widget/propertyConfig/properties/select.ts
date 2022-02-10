import { ValidationTypes } from "constants/WidgetValidation";
import { FieldType } from "widgets/JSONFormWidget/constants";
import { SelectFieldProps } from "widgets/JSONFormWidget/fields/SelectField";
import { HiddenFnParams, getSchemaItem } from "../helper";

const PROPERTIES = {
  general: [
    {
      propertyName: "defaultValue",
      helpText: "Selects the option with value by default",
      label: "Default Value",
      controlType: "JSON_FORM_COMPUTE_VALUE",
      placeholderText: '{ "label": "Option1", "value": "Option2" }',
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.OBJECT,
        params: {
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
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotMatches(FieldType.SELECT),
      dependencies: ["schema"],
    },
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
            if (schemaItem.fieldType !== FieldType.SELECT) return true;
            return !schemaItem.serverSideFiltering;
          },
        ),
    },
  ],
};

export default PROPERTIES;
