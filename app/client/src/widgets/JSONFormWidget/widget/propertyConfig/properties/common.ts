import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { get } from "lodash";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import {
  ARRAY_ITEM_KEY,
  FIELD_EXPECTING_OPTIONS,
  FIELD_SUPPORTING_FOCUS_EVENTS,
  FieldType,
  SchemaItem,
} from "widgets/JSONFormWidget/constants";
import { JSONFormWidgetProps } from "../..";
import { getParentPropertyPath } from "../../helper";
import {
  accessorUpdateHook,
  fieldTypeUpdateHook,
  getSchemaItem,
  HiddenFnParams,
  hiddenIfArrayItemIsObject,
  updateChildrenDisabledStateHook,
} from "../helper";

function accessorValidation(
  value: any,
  props: JSONFormWidgetProps,
  lodash: any,
  _: any,
  propertyPath: string,
): ValidationResponse {
  const propertyPathChunks = propertyPath.split(".");
  const grandParentPath = propertyPathChunks.slice(0, -2).join(".");
  const schemaItemIdentifier = propertyPathChunks.slice(-2)[0]; // ['schema', '__root_field__', 'children', 'age', 'name'] -> age
  const schema = lodash.cloneDeep(lodash.get(props, grandParentPath));
  const RESTRICTED_KEYS = ["__array_item__", "__root_schema__"];
  // Remove the current edited schemaItem from schema so it doesn't
  // get picked in the existing keys list
  delete schema[schemaItemIdentifier];

  if (typeof value !== "string") {
    return {
      isValid: false,
      parsed: value,
      messages: ["Accessor must be a string"],
    };
  }

  if (value === "") {
    return {
      isValid: false,
      parsed: value,
      messages: ["Accessor cannot be empty"],
    };
  }

  if (value !== value.replace(/[^\w]/gi, "_")) {
    return {
      isValid: false,
      parsed: value,
      messages: [
        "Accessor cannot have special characters, except underscore (_)",
      ],
    };
  }

  if (/\d/.test(value[0])) {
    return {
      isValid: false,
      parsed: value,
      messages: ["Accessor cannot start with a number"],
    };
  }

  const existingKeys = (Object.values(schema) || []).map(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (schemaItem) => schemaItem.name,
  );

  if (existingKeys.includes(value)) {
    return {
      isValid: false,
      parsed: value,
      messages: ["Accessor with same name is already present."],
    };
  }

  if (RESTRICTED_KEYS.includes(value)) {
    return {
      isValid: false,
      parsed: value,
      messages: ["Accessor cannot be a restricted name"],
    };
  }

  return {
    isValid: true,
    parsed: value,
    messages: [""],
  };
}

const COMMON_PROPERTIES = {
  fieldType: [
    {
      propertyName: "fieldType",
      label: "Field Type",
      controlType: "DROP_DOWN",
      isBindProperty: false,
      isTriggerProperty: false,
      options: Object.values(FieldType).map((option) => ({
        label: option,
        value: option,
      })),
      dependencies: ["schema"],
      updateHook: fieldTypeUpdateHook,
    },
  ],
  options: [
    {
      propertyName: "options",
      helpText:
        "Allows users to select from the given option(s). Values must be unique",
      label: "Options",
      controlType: "INPUT_TEXT",
      placeholderText: '[{ "label": "Option1", "value": "Option2" }]',
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
      evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotIncludes(FIELD_EXPECTING_OPTIONS),
      dependencies: ["schema", "sourceData"],
    },
  ],
  customField: [
    {
      helpText:
        "Sets the key which can be used to access the particular field.",
      propertyName: "accessor",
      label: "Accessor",
      controlType: "INPUT_TEXT",
      placeholderText: "name",
      isBindProperty: true,
      isTriggerProperty: false,
      updateHook: accessorUpdateHook,
      validation: {
        type: ValidationTypes.FUNCTION,
        params: {
          fn: accessorValidation,
          expected: {
            type:
              "unique string with no special characters except(_) and should not start with number(s)",
            example: `firstName | last_name | age14`,
            autocompleteDataType: AutocompleteDataType.STRING,
          },
        },
      },
      hidden: (props: JSONFormWidgetProps, propertyPath: string) => {
        const parentPath = getParentPropertyPath(propertyPath);
        const schemaItem: SchemaItem = get(props, parentPath);
        const isArrayItem = schemaItem.identifier === ARRAY_ITEM_KEY;

        if (isArrayItem) return true;
      },
      dependencies: ["schema"],
    },
  ],
  accessibility: [
    {
      helpText: "Sets the label text of the field",
      propertyName: "label",
      label: "Label",
      controlType: "INPUT_TEXT",
      placeholderText: "Name:",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
      hidden: hiddenIfArrayItemIsObject,
      dependencies: ["schema", "sourceData"],
    },
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
        const isHidden = hiddenIfArrayItemIsObject(...args);
        if (isHidden) return true;

        return getSchemaItem(...args).then(
          (schemaItem) =>
            schemaItem.fieldType === FieldType.OBJECT ||
            schemaItem.fieldType === FieldType.ARRAY,
        );
      },
      dependencies: ["schema", "sourceData"],
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
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      validation: { type: ValidationTypes.BOOLEAN },
      hidden: hiddenIfArrayItemIsObject,
      dependencies: ["schema", "sourceData"],
    },
    {
      helpText: "Disables the field",
      propertyName: "isDisabled",
      label: "Disabled",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      validation: { type: ValidationTypes.BOOLEAN },
      hidden: hiddenIfArrayItemIsObject,
      dependencies: ["schema", "sourceData"],
      updateHook: updateChildrenDisabledStateHook,
    },
    {
      helpText: "Show help text or details about current field",
      propertyName: "tooltip",
      label: "Tooltip",
      controlType: "JSON_FORM_COMPUTE_VALUE",
      placeholderText: "Passwords must be at-least 6 chars",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
      hidden: hiddenIfArrayItemIsObject,
      dependencies: ["schema", "sourceData"],
    },
  ],
  labelStyles: [
    {
      propertyName: "labelTextColor",
      label: "Text Color",
      controlType: "COLOR_PICKER",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          regex: /^(?![<|{{]).+/,
        },
      },
      dependencies: ["schema", "sourceData"],
    },
    {
      propertyName: "labelTextSize",
      label: "Text Size",
      controlType: "DROP_DOWN",
      options: [
        {
          label: "Heading 1",
          value: "HEADING1",
          subText: "24px",
          icon: "HEADING_ONE",
        },
        {
          label: "Heading 2",
          value: "HEADING2",
          subText: "18px",
          icon: "HEADING_TWO",
        },
        {
          label: "Heading 3",
          value: "HEADING3",
          subText: "16px",
          icon: "HEADING_THREE",
        },
        {
          label: "Paragraph",
          value: "PARAGRAPH",
          subText: "14px",
          icon: "PARAGRAPH",
        },
        {
          label: "Paragraph 2",
          value: "PARAGRAPH2",
          subText: "12px",
          icon: "PARAGRAPH_TWO",
        },
      ],
      isBindProperty: false,
      isTriggerProperty: false,
    },
    {
      propertyName: "labelStyle",
      label: "Label Font Style",
      controlType: "BUTTON_TABS",
      options: [
        {
          icon: "BOLD_FONT",
          value: "BOLD",
        },
        {
          icon: "ITALICS_FONT",
          value: "ITALIC",
        },
      ],
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      validation: { type: ValidationTypes.TEXT },
      dependencies: ["schema", "sourceData"],
    },
  ],
  actions: [
    {
      propertyName: "onFocus",
      helpText: "Triggers an action when focused.",
      label: "onFocus",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      dependencies: ["schema", "sourceData"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotIncludes(
          FIELD_SUPPORTING_FOCUS_EVENTS,
        ),
    },
    {
      propertyName: "onBlur",
      helpText: "Triggers an action when the field loses focus.",
      label: "onBlur",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      dependencies: ["schema", "sourceData"],
      hidden: (...args: HiddenFnParams) =>
        getSchemaItem(...args).fieldTypeNotIncludes(
          FIELD_SUPPORTING_FOCUS_EVENTS,
        ),
    },
  ],
  styles: [
    {
      propertyName: "backgroundColor",
      label: "Background Color",
      controlType: "COLOR_PICKER",
      helpText: "Changes the background color",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          regex: /^(?![<|{{]).+/,
        },
      },
      dependencies: ["schema"],
    },
    {
      propertyName: "cellBackgroundColor",
      label: "Cell Background Color",
      controlType: "COLOR_PICKER",
      helpText: "Changes the background color of the cell",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          regex: /^(?![<|{{]).+/,
        },
      },
      dependencies: ["schema"],
    },
    {
      propertyName: "cellBorderColor",
      label: "Cell Border Color",
      helpText: "Changes the border color of the cell",
      controlType: "COLOR_PICKER",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      customJSControl: "JSON_FORM_COMPUTE_VALUE",
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          regex: /^(?![<|{{]).+/,
        },
      },
      dependencies: ["schema"],
    },
  ],
};

export default COMMON_PROPERTIES;
