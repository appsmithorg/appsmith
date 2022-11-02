import React from "react";
import { compact, xor } from "lodash";

import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { TextSize, WidgetType } from "constants/WidgetConstants";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

import {
  CheckboxGroupAlignmentTypes,
  LabelPosition,
} from "components/constants";
import { Alignment } from "@blueprintjs/core";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

import CheckboxGroupComponent from "../component";
import { OptionProps, SelectAllState, SelectAllStates } from "../constants";

export function defaultSelectedValuesValidation(
  value: unknown,
): ValidationResponse {
  let values: string[] = [];

  if (typeof value === "string") {
    try {
      values = JSON.parse(value);
      if (!Array.isArray(values)) {
        throw new Error();
      }
    } catch {
      values = value.length ? value.split(",") : [];
      if (values.length > 0) {
        values = values.map((_v: string) => _v.trim());
      }
    }
  }

  if (Array.isArray(value)) {
    values = Array.from(new Set(value));
  }

  return {
    isValid: true,
    parsed: values,
  };
}

class CheckboxGroupWidget extends BaseWidget<
  CheckboxGroupWidgetProps,
  WidgetState
> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            helpText: "Displays a list of unique checkbox options",
            propertyName: "options",
            label: "Options",
            controlType: "OPTION_INPUT",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                default: [],
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
                        },
                      },
                    ],
                  },
                },
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
          {
            helpText: "Sets the values of the options checked by default",
            propertyName: "defaultSelectedValues",
            label: "Default Selected Values",
            placeholderText: '["apple", "orange"]',
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: defaultSelectedValuesValidation,
                expected: {
                  type: "String or Array<string>",
                  example: `apple | ["apple", "orange"]`,
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
            controlType: "ICON_TABS",
            fullWidth: true,
            options: [
              { label: "Auto", value: LabelPosition.Auto },
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
            hidden: (props: CheckboxGroupWidgetProps) =>
              props.labelPosition !== LabelPosition.Left,
            dependencies: ["labelPosition"],
          },
          {
            helpText:
              "Sets the label width of the widget as the number of columns",
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
            hidden: (props: CheckboxGroupWidgetProps) =>
              props.labelPosition !== LabelPosition.Left,
            dependencies: ["labelPosition"],
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
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            helpText: "Disables input to this widget",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          {
            propertyName: "isInline",
            label: "Inline",
            controlType: "SWITCH",
            helpText: "Displays the checkboxes horizontally",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          {
            propertyName: "isSelectAll",
            label: "Select All Options",
            controlType: "SWITCH",
            helpText: "Controls whether select all option is shown",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
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
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "Triggers an action when the check state is changed",
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
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Label Styles",
        children: [
          {
            propertyName: "labelTextColor",
            label: "Font Color",
            helpText: "Control the color of the label associated",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "labelTextSize",
            label: "Font Size",
            helpText: "Control the font size of the label associated",
            controlType: "DROP_DOWN",
            defaultValue: "0.875rem",
            options: [
              {
                label: "S",
                value: "0.875rem",
                subText: "0.875rem",
              },
              {
                label: "M",
                value: "1rem",
                subText: "1rem",
              },
              {
                label: "L",
                value: "1.25rem",
                subText: "1.25rem",
              },
              {
                label: "XL",
                value: "1.875rem",
                subText: "1.875rem",
              },
              {
                label: "XXL",
                value: "3rem",
                subText: "3rem",
              },
              {
                label: "3XL",
                value: "3.75rem",
                subText: "3.75rem",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "labelStyle",
            label: "Emphasis",
            helpText: "Control if the label should be bold or italics",
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
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            propertyName: "optionAlignment",
            label: "Alignment",
            controlType: "DROP_DOWN",
            helpText: "Sets alignment between options.",
            options: [
              {
                label: "None",
                value: CheckboxGroupAlignmentTypes.NONE,
              },
              {
                label: "Start",
                value: CheckboxGroupAlignmentTypes.START,
              },
              {
                label: "End",
                value: CheckboxGroupAlignmentTypes.END,
              },
              {
                label: "Center",
                value: CheckboxGroupAlignmentTypes.CENTER,
              },
              {
                label: "Between",
                value: CheckboxGroupAlignmentTypes.SPACE_BETWEEN,
              },
              {
                label: "Around",
                value: CheckboxGroupAlignmentTypes.SPACE_AROUND,
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  CheckboxGroupAlignmentTypes.NONE,
                  CheckboxGroupAlignmentTypes.START,
                  CheckboxGroupAlignmentTypes.END,
                  CheckboxGroupAlignmentTypes.CENTER,
                  CheckboxGroupAlignmentTypes.SPACE_BETWEEN,
                  CheckboxGroupAlignmentTypes.SPACE_AROUND,
                ],
              },
            },
          },
        ],
      },
      {
        sectionName: "Color",
        children: [
          {
            propertyName: "accentColor",
            helpText: "Sets the checked state color of the checkbox",
            label: "Accent Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Border and Shadow",
        children: [
          {
            propertyName: "borderRadius",
            label: "Border Radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",

            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedValues: "defaultSelectedValues",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedValues: undefined,
      isDirty: false,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{ this.isRequired ? !!this.selectedValues.length : true }}`,
      value: `{{this.selectedValues}}`,
    };
  }

  componentDidUpdate(prevProps: CheckboxGroupWidgetProps) {
    if (
      Array.isArray(prevProps.options) &&
      Array.isArray(this.props.options) &&
      this.props.options.length !== prevProps.options.length
    ) {
      const prevOptions = compact(prevProps.options).map(
        (prevOption) => prevOption.value,
      );
      const options = compact(this.props.options).map((option) => option.value);

      // Get an array containing all the options of prevOptions that are not in options and vice-versa
      const diffOptions = prevOptions
        .filter((option) => !options.includes(option))
        .concat(options.filter((option) => !prevOptions.includes(option)));

      let selectedValues = this.props.selectedValues.filter(
        (selectedValue: string) => !diffOptions.includes(selectedValue),
      );
      // if selectedValues empty, and options have changed, set defaultSelectedValues
      if (!selectedValues.length && this.props.defaultSelectedValues.length) {
        selectedValues = this.props.defaultSelectedValues;
      }

      this.props.updateWidgetMetaProperty("selectedValues", selectedValues, {
        triggerPropertyName: "onSelectionChange",
        dynamicString: this.props.onSelectionChange,
        event: {
          type: EventType.ON_CHECK_CHANGE,
        },
      });
    }
    // Reset isDirty to false whenever defaultSelectedValues changes
    if (
      xor(this.props.defaultSelectedValues, prevProps.defaultSelectedValues)
        .length > 0 &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  getPageView() {
    return (
      <CheckboxGroupComponent
        accentColor={this.props.accentColor}
        borderRadius={this.props.borderRadius}
        compactMode={
          !(
            (this.props.bottomRow - this.props.topRow) /
              GRID_DENSITY_MIGRATION_V1 >
            1
          )
        }
        isDisabled={this.props.isDisabled}
        isInline={this.props.isInline}
        isRequired={this.props.isRequired}
        isSelectAll={this.props.isSelectAll}
        isValid={this.props.isValid}
        key={this.props.widgetId}
        labelAlignment={this.props.labelAlignment}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelText={this.props.labelText}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        labelWidth={this.getLabelWidth()}
        onChange={this.handleCheckboxChange}
        onSelectAllChange={this.handleSelectAllChange}
        optionAlignment={this.props.optionAlignment}
        options={compact(this.props.options)}
        selectedValues={this.props.selectedValues || []}
        widgetId={this.props.widgetId}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "CHECKBOX_GROUP_WIDGET";
  }

  private handleCheckboxChange = (value: string) => {
    return (event: React.FormEvent<HTMLElement>) => {
      let { selectedValues = [] } = this.props;
      const isChecked = (event.target as HTMLInputElement).checked;
      if (isChecked) {
        selectedValues = [...selectedValues, value];
      } else {
        selectedValues = selectedValues.filter(
          (item: string) => item !== value,
        );
      }

      // Update isDirty to true whenever value changes
      if (!this.props.isDirty) {
        this.props.updateWidgetMetaProperty("isDirty", true);
      }

      this.props.updateWidgetMetaProperty("selectedValues", selectedValues, {
        triggerPropertyName: "onSelectionChange",
        dynamicString: this.props.onSelectionChange,
        event: {
          type: EventType.ON_CHECKBOX_GROUP_SELECTION_CHANGE,
        },
      });
    };
  };

  private handleSelectAllChange = (state: SelectAllState) => {
    return () => {
      let { selectedValues = [] } = this.props;

      switch (state) {
        case SelectAllStates.UNCHECKED:
          selectedValues = this.props.options.map((option) => option.value);
          break;

        default:
          selectedValues = [];
          break;
      }

      if (!this.props.isDirty) {
        this.props.updateWidgetMetaProperty("isDirty", true);
      }

      this.props.updateWidgetMetaProperty("selectedValues", selectedValues, {
        triggerPropertyName: "onSelectionChange",
        dynamicString: this.props.onSelectionChange,
        event: {
          type: EventType.ON_CHECKBOX_GROUP_SELECTION_CHANGE,
        },
      });
    };
  };
}

export interface CheckboxGroupWidgetProps extends WidgetProps {
  options: OptionProps[];
  isInline: boolean;
  isSelectAll?: boolean;
  isRequired?: boolean;
  isDisabled: boolean;
  isValid?: boolean;
  onCheckChanged?: string;
  optionAlignment?: string;
  labelText?: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth?: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  accentColor: string;
  borderRadius: string;
}

export default CheckboxGroupWidget;
