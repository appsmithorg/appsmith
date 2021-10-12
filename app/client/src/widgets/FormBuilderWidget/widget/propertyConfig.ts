import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { FormBuilderWidgetProps } from ".";
import { ValidationTypes } from "constants/WidgetValidation";

const formDataValidationFn = (
  value: any,
  props: FormBuilderWidgetProps,
  _?: any,
) => {
  if (_.isObject(value)) {
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

const updateDerivedColumnsHook = (
  props: FormBuilderWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  return;
};

export default [
  {
    sectionName: "General",
    children: [
      {
        propertyName: "formData",
        helpText: "Input JSON sample for default form layout",
        label: "Form Data",
        controlType: "INPUT_TEXT",
        placeholderText: 'Enter { "firstName": "John" }',
        isBindProperty: true,
        isTriggerProperty: false,
        // TODO: Add JSON validation type?
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
        propertyName: "schema.__root__.children",
        helpText: "Field configuration",
        label: "Field Configuration",
        controlType: "FIELD_CONFIGURATION",
        isBindProperty: false,
        isTriggerProperty: false,
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
];
