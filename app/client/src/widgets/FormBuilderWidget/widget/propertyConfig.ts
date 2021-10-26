import { get, isEmpty } from "lodash";

import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { DropDownControlProps } from "components/propertyControls/DropDownControl";
import { DropdownOption } from "components/constants";
import { FormBuilderWidgetProps } from ".";
import {
  ARRAY_ITEM_KEY,
  DATA_TYPE_POTENTIAL_FIELD,
  FieldType,
  FIELD_EXPECTING_OPTIONS,
  ROOT_SCHEMA_KEY,
  SchemaItem,
} from "../constants";
import { ValidationTypes } from "constants/WidgetValidation";
import { PanelConfig } from "constants/PropertyControlConstants";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import SchemaParser from "../schemaParser";

const MAX_NESTING_LEVEL = 5;

// propertyPath -> "schema[0].children[0].fieldType"
// returns parentPropertyPath -> "schema[0].children[0]"
const getParentPropertyPath = (propertyPath: string) => {
  const propertyPathChunks = propertyPath.split(".");

  return propertyPathChunks.slice(0, -1).join(".");
};

// propertyPath -> "schema[0].children[0].props.options"
// returns grandParentPropertyPath -> "schema[0].children[0]"
const getGrandParentPropertyPath = (propertyPath: string) => {
  const propertyPathChunks = propertyPath.split(".");

  return propertyPathChunks.slice(0, -2).join(".");
};

const fieldTypeOptionsFn = (controlProps: DropDownControlProps) => {
  const { propertyName, widgetProperties } = controlProps;
  const parentPropertyPath = getParentPropertyPath(propertyName);
  const schemaItem: SchemaItem = get(widgetProperties, parentPropertyPath, {});
  const { dataType, isCustomField } = schemaItem;
  const potentialField = isCustomField
    ? Object.values(FieldType)
    : DATA_TYPE_POTENTIAL_FIELD[dataType]?.options || [];

  let options: DropdownOption[] = [];
  if (potentialField) {
    options = potentialField.map((option) => ({
      label: option,
      value: option,
    }));
  }

  return options;
};

const hiddenIfArrayItemIsObject = (
  props: FormBuilderWidgetProps,
  propertyPath: string,
  options?: { checkGrandParentPath: boolean },
) => {
  const pathFinder = options?.checkGrandParentPath
    ? getGrandParentPropertyPath
    : getParentPropertyPath;
  const path = pathFinder(propertyPath);

  const schemaItem: SchemaItem = get(props, path, {});

  return (
    schemaItem.name === ARRAY_ITEM_KEY &&
    (schemaItem.fieldType === FieldType.OBJECT ||
      schemaItem.fieldType === FieldType.ARRAY)
  );
};

const fieldTypeUpdateHook = (
  props: FormBuilderWidgetProps,
  propertyPath: string,
  fieldType: FieldType,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const schemaItemPath = getParentPropertyPath(propertyPath);
  const schemaItem: SchemaItem = get(props, schemaItemPath, {});

  const newSchemaItem = SchemaParser.getSchemaItemByFieldType(
    schemaItem.name,
    fieldType,
    {
      isCustomField: schemaItem.isCustomField,
    },
  );

  return [{ propertyPath: schemaItemPath, propertyValue: newSchemaItem }];
};

const generatePanelConfig = (nestingLevel: number): PanelConfig | undefined => {
  if (nestingLevel === 0) return;

  return {
    editableTitle: true,
    titlePropertyName: "label",
    panelIdPropertyName: "name",
    children: [
      {
        sectionName: "FieldControl",
        children: [
          {
            propertyName: "fieldType",
            label: "Field Type",
            controlType: "DROP_DOWN",
            isBindProperty: false,
            isTriggerProperty: false,
            optionsFn: fieldTypeOptionsFn,
            dependencies: ["schema"],
            updateHook: fieldTypeUpdateHook,
          },
          {
            propertyName: "props.options",
            label: "Options",
            controlType: "INPUT_TEXT",
            placeholderText: '[{ "label": "Option1", "value": "Option2" }]',
            isBindProperty: true,
            isTriggerProperty: false,
            hidden: (props: FormBuilderWidgetProps, propertyPath: string) => {
              const grandParentPropertyPath = getGrandParentPropertyPath(
                propertyPath,
              );
              const schemaItem: SchemaItem = get(
                props,
                grandParentPropertyPath,
                {},
              );
              const { fieldType } = schemaItem;

              return !FIELD_EXPECTING_OPTIONS.includes(fieldType);
            },
            dependencies: ["schema"],
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                default: [],
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
                          required: true,
                        },
                      },
                      {
                        name: "value",
                        type: ValidationTypes.TEXT,
                        params: {
                          default: "",
                          required: true,
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          {
            helpText: "Disables the field",
            propertyName: "props.isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
            hidden: (...args) =>
              hiddenIfArrayItemIsObject(...args, {
                checkGrandParentPath: true,
              }),
            dependencies: ["schema"],
          },
          {
            helpText: "Controls the visibility of the field",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
            hidden: hiddenIfArrayItemIsObject,
            dependencies: ["schema"],
          },
          {
            helpText: "Show help text or details about current input",
            propertyName: "tooltip",
            label: "Tooltip",
            controlType: "INPUT_TEXT",
            placeholderText: "Passwords must be atleast 6 chars",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
            hidden: hiddenIfArrayItemIsObject,
            dependencies: ["schema"],
          },
          {
            propertyName: "children",
            label: "Field Configuration",
            controlType: "FIELD_CONFIGURATION",
            isBindProperty: false,
            isTriggerProperty: false,
            panelConfig: generatePanelConfig(nestingLevel - 1) as PanelConfig,
            hidden: (props: FormBuilderWidgetProps, propertyPath: string) => {
              const schemaItemPath = getParentPropertyPath(propertyPath);
              const schemaItem: SchemaItem = get(props, schemaItemPath, {});

              return (
                schemaItem.fieldType !== FieldType.OBJECT &&
                isEmpty(schemaItem.children)
              );
            },
            dependencies: ["schema"],
          },
        ],
      },
    ],
  } as PanelConfig;
};

const panelConfig = generatePanelConfig(MAX_NESTING_LEVEL);

const formDataValidationFn = (
  value: any,
  props: FormBuilderWidgetProps,
  _?: any,
) => {
  if (_.isPlainObject(value)) {
    return {
      isValid: true,
      parsed: value,
    };
  }

  try {
    return {
      isValid: true,
      parsed: JSON.parse(value as string),
    };
  } catch {
    return {
      isValid: true,
      parsed: {},
    };
  }
};

export default [
  {
    sectionName: "General",
    children: [
      {
        propertyName: "title",
        label: "Title",
        helpText: "Sets the title of the form",
        controlType: "INPUT_TEXT",
        placeholderText: "Update Order",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        // TODO: Change formData to Source data
        propertyName: "formData",
        helpText: "Input JSON sample for default form layout",
        label: "Form Data",
        controlType: "INPUT_TEXT",
        placeholderText: 'Enter { "name": "John", "age": 24 }',
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: formDataValidationFn,
            expected: {
              type: "JSON",
              example: `{ "name": "John Doe", age: 29 }`,
              // TODO: CHECK WHAT AutocompleteDataType is
              autocompleteDataType: AutocompleteDataType.OBJECT,
            },
          },
        },
      },
      {
        propertyName: "useFormDataValues",
        helpText:
          "It will use the values of the form data as the initial values for the form fields. Disabling this would make the form fields empty.",
        label: "Use Form Data Values",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: `schema.${ROOT_SCHEMA_KEY}.children`,
        helpText: "Field configuration",
        label: "Field Configuration",
        controlType: "FIELD_CONFIGURATION",
        isBindProperty: false,
        isTriggerProperty: false,
        panelConfig,
      },
      {
        propertyName: "backgroundColor",
        label: "Background Color",
        controlType: "COLOR_PICKER",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "fixedFooter",
        helpText: "Makes the footer always stick to the bottom of the form",
        label: "Fixed Footer",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "isVisible",
        helpText: "Controls the visibility of the widget",
        label: "Visible",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "scrollContents",
        helpText: "Allows scrolling of the form",
        label: "Scroll Contents",
        controlType: "SWITCH",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
  {
    sectionName: "Actions",
    children: [
      {
        helpText: "Triggers an action when the submit button is clicked",
        propertyName: "onSubmit",
        label: "onSubmit",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        helpText: "Triggers an action when the reset button is clicked",
        propertyName: "onReset",
        label: "onReset",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
];
