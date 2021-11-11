import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { FormBuilderWidgetProps } from ".";
import { ROOT_SCHEMA_KEY } from "../constants";
import { ValidationTypes } from "constants/WidgetValidation";
import generatePanelPropertyConfig from "./propertyConfig/fieldPropertyConfig";

const MAX_NESTING_LEVEL = 5;

const panelConfig = generatePanelPropertyConfig(MAX_NESTING_LEVEL);

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
              autocompleteDataType: AutocompleteDataType.OBJECT,
            },
          },
        },
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
        propertyName: "showReset",
        label: "Show Reset",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
];
