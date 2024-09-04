import {
  ValidationTypes,
  type ValidationResponse,
} from "constants/WidgetValidation";
import { get, isPlainObject, uniq, type LoDashStatic } from "lodash";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";

import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { EVAL_VALUE_PATH } from "../../../../../utils/DynamicBindingUtils";
import type { PropertyUpdates } from "../../../../../WidgetProvider/constants";
import type { WidgetProps } from "../../../../BaseWidget";
import type { WDSSelectWidgetProps } from "../../widget/types";
import {
  defaultOptionValidation,
  optionsCustomValidation,
} from "./validations";

type WidgetTypeValue = "SELECT" | "COMBOBOX";

interface ValidationErrorMessage {
  name: string;
  message: string;
}

export const getOptionLabelValueExpressionPrefix = (widget: WidgetProps) =>
  `{{${widget.widgetName}.sourceData.map((item) => (`;

export const optionLabelValueExpressionSuffix = `))}}`;

export function getLabelValueKeyOptions(
  widget: WidgetProps,
): Record<string, unknown>[] {
  // UTILS
  const isTrueObject = (item: unknown): item is Record<string, unknown> => {
    return Object.prototype.toString.call(item) === "[object Object]";
  };

  const sourceData = get(widget, `${EVAL_VALUE_PATH}.options`);
  const widgetOptions = get(widget, "options");
  const options = sourceData || widgetOptions;

  // Is Form mode, otherwise it is JS mode
  if (Array.isArray(widgetOptions)) {
    return options.map((option: Record<string, unknown> | string) => {
      if (isTrueObject(option)) {
        return {
          label: option[widget.optionLabel],
          value: option[widget.optionValue],
        };
      }

      return [];
    });
  }

  if (Array.isArray(options)) {
    const x = uniq(
      options.reduce((keys, obj) => {
        if (isPlainObject(obj)) {
          Object.keys(obj).forEach((d) => keys.push(d));
        }

        return keys;
      }, []),
    ).map((d: unknown) => ({
      label: d,
      value: d,
    }));

    return x;
  } else {
    return [];
  }
}

export function labelKeyValidation(
  value: unknown,
  widgetProps: WDSSelectWidgetProps,
  _: LoDashStatic,
) {
  // UTILS
  const hasDuplicates = (array: unknown[]): boolean => {
    const set = new Set(array);

    return set.size !== array.length;
  };

  const createErrorValidationResponse = (
    value: unknown,
    message: ValidationErrorMessage,
  ): ValidationResponse => ({
    isValid: false,
    parsed: value,
    messages: [message],
  });

  const createSuccessValidationResponse = (
    value: unknown,
  ): ValidationResponse => ({
    isValid: true,
    parsed: value,
  });

  if (value === "" || _.isNil(value)) {
    return createErrorValidationResponse(value, {
      name: "ValidationError",
      message: `value does not evaluate to type: string | Array<string>`,
    });
  }

  if (Array.isArray(widgetProps.options)) {
    const values = _.map(widgetProps.options, (option) => {
      return option[widgetProps.optionLabel];
    }).filter((d) => d);

    if (values.length && hasDuplicates(values)) {
      return createErrorValidationResponse(value, {
        name: "ValidationError",
        message: "Duplicate values found, value must be unique",
      });
    }
  }

  if (_.isString(value)) {
    const keys = _.map(widgetProps.options, _.keys).flat();

    if (!keys.includes(value)) {
      return createErrorValidationResponse(value, {
        name: "ValidationError",
        message: "value key should be present in the options",
      });
    }

    return createSuccessValidationResponse(value);
  } else if (_.isArray(value)) {
    const errorIndex = value.findIndex((d) => !_.isString(d));

    if (errorIndex === -1) {
      return createSuccessValidationResponse(value);
    }

    return createErrorValidationResponse(value, {
      name: "ValidationError",
      message: `Invalid entry at index: ${errorIndex}. This value does not evaluate to type: string`,
    });
  } else {
    return createErrorValidationResponse(value, {
      name: "ValidationError",
      message: `value does not evaluate to type: string | Array<string>`,
    });
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
  widgetProps: WDSSelectWidgetProps,
  _: LoDashStatic,
) {
  // UTILS
  const isTrueObject = (item: unknown): item is Record<string, unknown> => {
    return Object.prototype.toString.call(item) === "[object Object]";
  };

  const hasDuplicates = (array: unknown[]): boolean => {
    const set = new Set(array);

    return set.size !== array.length;
  };

  const createErrorValidationResponse = (
    value: unknown,
    message: ValidationErrorMessage,
  ): ValidationResponse => ({
    isValid: false,
    parsed: value,
    messages: [message],
  });

  const createSuccessValidationResponse = (
    value: unknown,
  ): ValidationResponse => ({
    isValid: true,
    parsed: value,
  });

  if (value === "" || _.isNil(value) || !_.isString(value)) {
    return createErrorValidationResponse(value, {
      name: "ValidationError",
      message:
        "value does not evaluate to type: string | Array<string| number | boolean>",
    });
  }

  if (!_.flatMap(widgetProps.options, _.keys).includes(value)) {
    return createErrorValidationResponse(value, {
      name: "ValidationError",
      message: "value key should be present in the options",
    });
  }

  if (!isTrueObject(widgetProps.options)) {
    return createSuccessValidationResponse(value);
  }

  const values = _.map(widgetProps.options, (option) => {
    if (isTrueObject(option)) {
      return option[widgetProps.optionValue];
    }
  }).filter((d) => d);

  if (values.length && hasDuplicates(values)) {
    return createErrorValidationResponse(value, {
      name: "ValidationError",
      message: "Duplicate values found, value must be unique",
    });
  }

  return createSuccessValidationResponse(value);
}

export const propertyPaneContentConfig = [
  {
    sectionName: "Data",
    children: [
      {
        propertyName: "widgetType",
        label: "Data type",
        controlType: "DROP_DOWN",
        options: [
          {
            label: "Select",
            value: "SELECT",
          },
          {
            label: "ComboBox",
            value: "COMBOBOX",
          },
        ],
        isBindProperty: false,
        isTriggerProperty: false,
        defaultValue: "SELECT",
        updateHook: (
          _props: WidgetProps,
          propertyName: string,
          propertyValue: WidgetTypeValue,
        ) => {
          const updates: PropertyUpdates[] = [
            {
              propertyPath: propertyName,
              propertyValue: propertyValue,
            },
          ];

          // Handle widget morphing
          if (propertyName === "widgetType") {
            const morphingMap: Record<WidgetTypeValue, string> = {
              SELECT: "WDS_SELECT_WIDGET",
              COMBOBOX: "WDS_COMBOBOX_WIDGET",
            };

            const targetWidgetType = morphingMap[propertyValue];

            if (targetWidgetType) {
              updates.push({
                propertyPath: "type",
                propertyValue: targetWidgetType,
              });
            }
          }

          return updates;
        },
      },
      {
        helpText: "Displays a list of unique options",
        propertyName: "options",
        label: "Options",
        controlType: "OPTION_INPUT",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        dependencies: ["optionLabel", "optionValue"],
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
        evaluatedDependencies: ["options"],
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
        dependencies: ["options", "dynamicPropertyPathList"],
        additionalAutoComplete: getLabelValueAdditionalAutocompleteData,
        hidden: (props: WDSSelectWidgetProps) => {
          return !(props.dynamicPropertyPathList || []).some(
            ({ key }) => key === "options",
          );
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
        evaluatedDependencies: ["options"],
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
        dependencies: ["options", "dynamicPropertyPathList"],
        additionalAutoComplete: getLabelValueAdditionalAutocompleteData,
        hidden: (props: WDSSelectWidgetProps) => {
          return !(props.dynamicPropertyPathList || []).some(
            ({ key }) => key === "options",
          );
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
        dependencies: ["options"],
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
