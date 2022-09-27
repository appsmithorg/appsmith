import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { ValidationTypes } from "constants/WidgetValidation";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { NumberSliderWidgetProps } from "..";
import {
  defaultValueValidation,
  maxValueValidation,
  minValueValidation,
  stepSizeValidation,
} from "../../validations";

export default [
  {
    sectionName: "Data",
    children: [
      {
        propertyName: "min",
        helpText: "Sets the min value of the widget",
        label: "Min. Value",
        controlType: "INPUT_TEXT",
        placeholderText: "0",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: minValueValidation,
            expected: {
              type: "number",
              example: "0",
              autocompleteDataType: AutocompleteDataType.NUMBER,
            },
          },
        },
      },
      {
        propertyName: "max",
        helpText: "Sets the max value of the widget",
        label: "Max. Value",
        controlType: "INPUT_TEXT",
        placeholderText: "100",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: maxValueValidation,
            expected: {
              type: "number",
              example: "100",
              autocompleteDataType: AutocompleteDataType.NUMBER,
            },
          },
        },
      },
      {
        propertyName: "step",
        helpText: "The amount by which the slider value should increase",
        label: "Step Size",
        controlType: "INPUT_TEXT",
        placeholderText: "10",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: stepSizeValidation,
            expected: {
              type: "number",
              example: "1",
              autocompleteDataType: AutocompleteDataType.NUMBER,
            },
          },
        },
      },
      {
        propertyName: "defaultValue",
        helpText: "Sets the value of the widget",
        label: "Default Value",
        controlType: "INPUT_TEXT",
        placeholderText: "Value:",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: defaultValueValidation,
            expected: {
              type: "number",
              example: "50",
              autocompleteDataType: AutocompleteDataType.NUMBER,
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
        helpText: "Sets the label text of the widget",
        propertyName: "labelText",
        label: "Text",
        controlType: "INPUT_TEXT",
        placeholderText: "Enter label text",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        helpText: "Sets the label position of the widget",
        propertyName: "labelPosition",
        label: "Position",
        controlType: "DROP_DOWN",
        options: [
          { label: "Left", value: LabelPosition.Left },
          { label: "Top", value: LabelPosition.Top },
        ],
        isBindProperty: false,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        helpText: "Sets the label alignment of the widget",
        propertyName: "labelAlignment",
        label: "Alignment",
        controlType: "LABEL_ALIGNMENT_OPTIONS",
        options: [
          {
            icon: "LEFT_ALIGN",
            value: Alignment.LEFT,
          },
          {
            icon: "RIGHT_ALIGN",
            value: Alignment.RIGHT,
          },
        ],
        isBindProperty: false,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        hidden: (props: NumberSliderWidgetProps) =>
          props.labelPosition !== LabelPosition.Left,
        dependencies: ["labelPosition"],
      },
      {
        helpText: "Sets the label width of the widget as the number of columns",
        propertyName: "labelWidth",
        label: "Width (in columns)",
        controlType: "NUMERIC_INPUT",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        min: 0,
        validation: {
          type: ValidationTypes.NUMBER,
          params: {
            natural: true,
          },
        },
        hidden: (props: NumberSliderWidgetProps) =>
          props.labelPosition !== LabelPosition.Left,
        dependencies: ["labelPosition"],
      },
    ],
  },
  {
    sectionName: "General",
    children: [
      {
        propertyName: "showMarksLabel",
        helpText: "Show the marks label below the slider",
        label: "Show Marks",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        helpText: "Display Value Marks",
        propertyName: "marks",
        label: "Marks",
        controlType: "INPUT_TEXT",
        placeholderText: '[{ "value": "20", "label": "20%" }]',
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: NumberSliderWidgetProps) => !props.showMarksLabel,
        dependencies: ["showMarksLabel"],
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
                    name: "value",
                    type: ValidationTypes.NUMBER,
                    params: {
                      default: "",
                      requiredKey: true,
                    },
                  },
                  {
                    name: "label",
                    type: ValidationTypes.TEXT,
                    params: {
                      default: "",
                      requiredKey: true,
                    },
                  },
                ],
              },
            },
          },
        },
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
        propertyName: "isDisabled",
        label: "Disabled",
        controlType: "SWITCH",
        helpText: "Disables clicks to this widget",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "animateLoading",
        label: "Animate Loading",
        controlType: "SWITCH",
        helpText: "Controls the loading of the widget",
        defaultValue: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "tooltipAlwaysOn",
        helpText: "Keep showing the tooltip with value",
        label: "Tooltip Always On",
        controlType: "SWITCH",
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
        helpText: "Triggers an action when a user changes the slider value",
        propertyName: "onChange",
        label: "onChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
];
