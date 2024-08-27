import { ValidationTypes } from "constants/WidgetValidation";
import {
  get,
  isArray,
  isPlainObject,
  isString,
  uniq,
  type LoDashStatic,
} from "lodash";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";

import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { EVAL_VALUE_PATH } from "../../../../../utils/DynamicBindingUtils";
import type { WidgetProps } from "../../../../BaseWidget";
import type { WDSSelectWidgetProps } from "../../widget/types";
import {
  defaultOptionValidation,
  optionsCustomValidation,
} from "./validations";

export const getOptionLabelValueExpressionPrefix = (widget: WidgetProps) =>
  `{{${widget.widgetName}.sourceData.map((item) => (`;

export const optionLabelValueExpressionSuffix = `))}}`;

export function getLabelValueKeyOptions(widget: WidgetProps) {
  const sourceData = get(widget, `${EVAL_VALUE_PATH}.sourceData`);

  let parsedValue: Record<string, unknown> | undefined = sourceData;

  if (isString(sourceData)) {
    try {
      parsedValue = JSON.parse(sourceData);
    } catch (e) {}
  }

  if (isArray(parsedValue)) {
    return uniq(
      parsedValue.reduce((keys, obj) => {
        if (isPlainObject(obj)) {
          Object.keys(obj).forEach((d) => keys.push(d));
        }

        return keys;
      }, []),
    ).map((d: unknown) => ({
      label: d,
      value: d,
    }));
  } else {
    return [];
  }
}

export function labelKeyValidation(
  value: unknown,
  _props: unknown,
  _: LoDashStatic,
) {
  /*
   * Validation rules
   *  1. Can be a string.
   *  2. Can be an Array of string, number, boolean (only for option Value).
   */

  if (value === "" || _.isNil(value)) {
    return {
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message: `value does not evaluate to type: string | Array<string>`,
        },
      ],
    };
  }

  if (_.isString(value)) {
    return {
      parsed: value,
      isValid: true,
      messages: [],
    };
  } else if (_.isArray(value)) {
    const errorIndex = value.findIndex((d) => !_.isString(d));

    return {
      parsed: errorIndex === -1 ? value : [],
      isValid: errorIndex === -1,
      messages:
        errorIndex !== -1
          ? [
              {
                name: "ValidationError",
                message: `Invalid entry at index: ${errorIndex}. This value does not evaluate to type: string`,
              },
            ]
          : [],
    };
  } else {
    return {
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message: "value does not evaluate to type: string | Array<string>",
        },
      ],
    };
  }
}

export function getLabelValueAdditionalAutocompleteData(props: WidgetProps) {
  const keys = getLabelValueKeyOptions(props);

  return {
    item: keys
      .map((d) => d.label)
      .reduce((prev: Record<string, string>, curr: unknown) => {
        prev[curr as string] = "";

        return prev;
      }, {}),
  };
}

export function valueKeyValidation(
  value: unknown,
  props: WDSSelectWidgetProps,
  _: LoDashStatic,
) {
  /*
   * Validation rules
   *  1. Can be a string.
   *  2. Can be an Array of string, number, boolean (only for option Value).
   *  3. should be unique.
   */

  if (value === "" || _.isNil(value)) {
    return {
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message: `value does not evaluate to type: string | Array<string| number | boolean>`,
        },
      ],
    };
  }

  let options: unknown[] = [];

  if (_.isString(value)) {
    const sourceData = _.isArray(props.sourceData) ? props.sourceData : [];

    const keys = sourceData.reduce((keys, curr) => {
      Object.keys(curr).forEach((d) => keys.add(d));

      return keys;
    }, new Set());

    if (!keys.has(value)) {
      return {
        parsed: value,
        isValid: false,
        messages: [
          {
            name: "ValidationError",
            message: `value key should be present in the source data`,
          },
        ],
      };
    }

    options = sourceData.map((d: Record<string, unknown>) => d[value]);
  } else if (_.isArray(value)) {
    const errorIndex = value.findIndex(
      (d) =>
        !(_.isString(d) || (_.isNumber(d) && !_.isNaN(d)) || _.isBoolean(d)),
    );

    if (errorIndex !== -1) {
      return {
        parsed: [],
        isValid: false,
        messages: [
          {
            name: "ValidationError",
            message: `Invalid entry at index: ${errorIndex}. This value does not evaluate to type: string | number | boolean`,
          },
        ],
      };
    } else {
      options = value;
    }
  } else {
    return {
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message:
            "value does not evaluate to type: string | Array<string | number | boolean>",
        },
      ],
    };
  }

  const isValid = options.every(
    (d: unknown, i: number, arr: unknown[]) => arr.indexOf(d) === i,
  );

  return {
    parsed: value,
    isValid: isValid,
    messages: isValid
      ? []
      : [
          {
            name: "ValidationError",
            message: "Duplicate values found, value must be unique",
          },
        ],
  };
}

export const propertyPaneContentConfig = [
  {
    sectionName: "Data",
    children: [
      {
        helpText: "Displays a list of unique options",
        propertyName: "options",
        label: "Options",
        controlType: "OPTION_INPUT",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: optionsCustomValidation,
            expected: {
              type: 'Array<{ "label": "string", "value": "string" | number}>',
              example: `[{"label": "One", "value": "one"}]`,
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      {
        helpText: "Choose or set a field from source data as the display label",
        propertyName: "optionLabel",
        label: "Label key",
        controlType: "DROP_DOWN",
        customJSControl: "WRAPPED_CODE_EDITOR",
        controlConfig: {
          wrapperCode: {
            prefix: getOptionLabelValueExpressionPrefix,
            suffix: optionLabelValueExpressionSuffix,
          },
        },
        placeholderText: "",
        isBindProperty: true,
        isTriggerProperty: false,
        isJSConvertible: true,
        evaluatedDependencies: ["sourceData"],
        options: getLabelValueKeyOptions,
        alwaysShowSelected: true,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: labelKeyValidation,
            expected: {
              type: "String or Array<string>",
              example: `color | ["blue", "green"]`,
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
        additionalAutoComplete: getLabelValueAdditionalAutocompleteData,
        hidden: (props: WDSSelectWidgetProps) => {
          return (props.dynamicPropertyPathList || []).length === 0;
        },
      },
      {
        helpText: "Choose or set a field from source data as the value",
        propertyName: "optionValue",
        label: "Value key",
        controlType: "DROP_DOWN",
        customJSControl: "WRAPPED_CODE_EDITOR",
        controlConfig: {
          wrapperCode: {
            prefix: getOptionLabelValueExpressionPrefix,
            suffix: optionLabelValueExpressionSuffix,
          },
        },
        placeholderText: "",
        isBindProperty: true,
        isTriggerProperty: false,
        isJSConvertible: true,
        evaluatedDependencies: ["sourceData"],
        options: getLabelValueKeyOptions,
        alwaysShowSelected: true,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: valueKeyValidation,
            expected: {
              type: "String or Array<string | number | boolean>",
              example: `color | [1, "orange"]`,
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
        additionalAutoComplete: getLabelValueAdditionalAutocompleteData,
        hidden: (props: WDSSelectWidgetProps) => {
          return (props.dynamicPropertyPathList || []).length === 0;
        },
      },
      {
        helpText: "Sets a default selected option",
        propertyName: "defaultOptionValue",
        label: "Default selected value",
        placeholderText: "",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        /**
         * Changing the validation to FUNCTION.
         * If the user enters Integer inside {{}} e.g. {{1}} then value should evalute to integer.
         * If user enters 1 e.g. then it should evaluate as string.
         */
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
      },
    ],
  },
  {
    sectionName: "Label",
    children: [
      {
        helpText: "Sets the label text of the options widget",
        propertyName: "label",
        label: "Text",
        controlType: "INPUT_TEXT",
        placeholderText: "Label",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
  {
    sectionName: "Validations",
    children: [
      {
        propertyName: "isRequired",
        label: "Required",
        helpText: "Makes input to the widget mandatory",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
  {
    sectionName: "General",
    children: [
      {
        helpText: "Show help text or details about current input",
        propertyName: "labelTooltip",
        label: "Tooltip",
        controlType: "INPUT_TEXT",
        placeholderText: "",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        helpText: "Sets a placeholder text for the select",
        propertyName: "placeholderText",
        label: "Placeholder",
        controlType: "INPUT_TEXT",
        placeholderText: "",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        hidden: (props: WDSSelectWidgetProps) => {
          return Boolean(props.isReadOnly);
        },
      },
      {
        helpText: "Controls the visibility of the widget",
        propertyName: "isVisible",
        label: "Visible",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "isDisabled",
        label: "Disabled",
        helpText: "Disables input to this widget",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "animateLoading",
        label: "Animate loading",
        controlType: "SWITCH",
        helpText: "Controls the loading of the widget",
        defaultValue: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
  {
    sectionName: "Events",
    children: [
      {
        helpText: "when a user changes the selected option",
        propertyName: "onSelectionChange",
        label: "onSelectionChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
];
