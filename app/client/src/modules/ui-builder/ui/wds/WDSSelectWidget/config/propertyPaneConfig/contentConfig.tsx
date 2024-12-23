import React from "react";
import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { WDSSelectWidgetProps } from "../../widget/types";
import { defaultOptionValueValidation } from "./validations";
import type { WidgetProps } from "widgets/BaseWidget";
import type { PropertyUpdates } from "WidgetProvider/constants";
import { valueKeyValidation } from "./validations/valueKeyValidation";
import {
  defaultValueExpressionPrefix,
  getDefaultValueExpressionSuffix,
  getLabelValueAdditionalAutocompleteData,
  getLabelValueKeyOptions,
  getOptionLabelValueExpressionPrefix,
  optionLabelValueExpressionSuffix,
} from "../../widget/helpers";
import { labelKeyValidation } from "./validations/labelKeyValidation";
import { Flex } from "@appsmith/ads";
import { SAMPLE_DATA } from "../../widget/constants";

type WidgetTypeValue = "SELECT" | "COMBOBOX";

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
        helpText:
          "Takes in an array of objects to display options. Bind data from an API using {{}}",
        propertyName: "sourceData",
        label: "Source Data",
        controlType: "ONE_CLICK_BINDING_CONTROL",
        controlConfig: {
          aliases: [
            {
              name: "label",
              isSearcheable: true,
              isRequired: true,
            },
            {
              name: "value",
              isRequired: true,
            },
          ],
          sampleData: JSON.stringify(SAMPLE_DATA, null, 2),
        },
        isJSConvertible: true,
        placeholderText: '[{ "label": "label1", "value": "value1" }]',
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.ARRAY,
          params: {
            children: {
              type: ValidationTypes.OBJECT,
              params: {
                required: true,
              },
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
      },
      {
        helpText: "Selects the option with value by default",
        propertyName: "defaultOptionValue",
        label: "Default selected value",
        controlType: "WRAPPED_CODE_EDITOR",
        controlConfig: {
          wrapperCode: {
            prefix: defaultValueExpressionPrefix,
            suffix: getDefaultValueExpressionSuffix,
          },
        },
        placeholderText: '{ "label": "label1", "value": "value1" }',
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: defaultOptionValueValidation,
            expected: {
              type: 'value1 or { "label": "label1", "value": "value1" }',
              example: `value1 | { "label": "label1", "value": "value1" }`,
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
        dependencies: ["options"],
        helperText: (
          <Flex marginTop="spaces-2">
            Make sure the default value is present in the source data to have it
            selected by default in the UI.
          </Flex>
        ),
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
