import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { PropertyUpdates } from "../../../../../WidgetProvider/constants";
import type { WidgetProps } from "../../../../BaseWidget";
import type { WDSComboBoxWidgetProps } from "../../widget/types";
import { optionsCustomValidation } from "./validations";

type WidgetTypeValue = "SELECT" | "COMBOBOX";

export const handleWidgetTypeUpdate = (
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
};

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
        updateHook: handleWidgetTypeUpdate,
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
        hidden: (props: WDSComboBoxWidgetProps) => {
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
