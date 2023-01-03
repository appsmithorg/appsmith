import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";
import { FieldType } from "widgets/JSONFormWidget/constants";
import { optionsCustomValidation } from "widgets/RadioGroupWidget/widget";
import {
  HiddenFnParams,
  getSchemaItem,
  getAutocompleteProperties,
} from "../helper";

/**
 * Alias function is used to test the optionsCustomValidation separately
 * to ensure that any changes in the validation function in RadioGroupWidget
 * does not break when used here.
 */
export const optionsValidation = optionsCustomValidation;

function defaultOptionValidation(
  value: unknown,
  props: any,
  _: any,
): ValidationResponse {
  //Checks if the value is not of object type in {{}}
  if (_.isObject(value)) {
    return {
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: ["This value does not evaluate to type: string or number"],
    };
  }

  //Checks if the value is not of boolean type in {{}}
  if (_.isBoolean(value)) {
    return {
      isValid: false,
      parsed: value,
      messages: ["This value does not evaluate to type: string or number"],
    };
  }

  return {
    isValid: true,
    parsed: value,
  };
}

const PROPERTIES = {
  content: {
    data: [
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
          type: ValidationTypes.FUNCTION,
          params: {
            fn: optionsValidation,
            expected: {
              type: 'Array<{ "label": "string", "value": "string" | number}>',
              example: `[{"label": "One", "value": "one"}]`,
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.RADIO_GROUP),
        dependencies: ["schema"],
      },
      {
        propertyName: "defaultValue",
        helpText: "Sets a default selected option",
        label: "Default Selected Value",
        placeholderText: "Y",
        controlType: "JSON_FORM_COMPUTE_VALUE",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: defaultOptionValidation,
            expected: {
              type: `string |\nnumber (only works in mustache syntax)`,
              example: `abc | {{1}}`,
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.RADIO_GROUP),
        dependencies: ["schema", "sourceData"],
      },
    ],
    events: [
      {
        propertyName: "onSelectionChange",
        helpText: "Triggers an action when a user changes the selected option",
        label: "onSelectionChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        additionalAutoComplete: getAutocompleteProperties,
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.RADIO_GROUP),
        dependencies: ["schema", "sourceData"],
      },
    ],
  },
};

export default PROPERTIES;
