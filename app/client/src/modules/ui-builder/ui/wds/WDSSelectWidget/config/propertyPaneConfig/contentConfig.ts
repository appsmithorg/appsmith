import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { WDSSelectWidgetProps } from "../../widget/types";
import {
  defaultOptionValidation,
  optionsCustomValidation,
} from "./validations";
import type { WidgetProps } from "widgets/BaseWidget";
import type { PropertyUpdates } from "WidgetProvider/constants";

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
