import React from "react";
import { Alignment } from "@blueprintjs/core";
import { xor } from "lodash";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { ValidationTypes } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

import SwitchGroupComponent, { OptionProps } from "../component";
import { LabelPosition } from "components/constants";
import { TextSize } from "constants/WidgetConstants";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

class SwitchGroupWidget extends BaseWidget<
  SwitchGroupWidgetProps,
  WidgetState
> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            helpText:
              "Displays a list of options for a user to select. Values must be unique",
            propertyName: "options",
            label: "Options",
            controlType: "INPUT_TEXT",
            placeholderText: '[{ "label": "Option1", "value": "Option2" }]',
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    allowedKeys: [
                      {
                        name: "label",
                        type: ValidationTypes.TEXT,
                        params: {
                          default: "",
                          required: true,
                          unique: true,
                        },
                      },
                      {
                        name: "value",
                        type: ValidationTypes.TEXT,
                        params: {
                          default: "",
                          unique: true,
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
            helpText:
              "Selects values of the options checked by default. Enter comma separated values for multiple selected",
            propertyName: "defaultSelectedValues",
            label: "Default Selected Values",
            placeholderText: "Enter option values",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                default: [],
                children: {
                  type: ValidationTypes.TEXT,
                },
                strict: true,
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
            hidden: (props: SwitchGroupWidgetProps) =>
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
            hidden: (props: SwitchGroupWidgetProps) =>
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
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
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
            helpText: "Disables input to the widget",
            label: "Disabled",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isInline",
            helpText:
              "Whether switches are to be displayed inline horizontally",
            label: "Inline",
            controlType: "SWITCH",
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
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText:
              "Triggers an action when a switch state inside the group is changed",
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
            propertyName: "alignment",
            helpText: "Sets the alignment of the widget",
            label: "Alignment",
            controlType: "ICON_TABS",
            fullWidth: true,
            isBindProperty: true,
            isTriggerProperty: false,
            options: [
              {
                label: "Left",
                value: Alignment.LEFT,
              },
              {
                label: "Right",
                value: Alignment.RIGHT,
              },
            ],
          },
        ],
      },
      {
        sectionName: "Color",
        children: [
          {
            propertyName: "accentColor",
            helpText: "Sets the background color of the widget",
            label: "Accent Color",
            controlType: "COLOR_PICKER",
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
      selectedValuesArray: "defaultSelectedValues",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedValuesArray: undefined,
      isDirty: false,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{ this.isRequired ? !!this.selectedValues.length : true }}`,
      selectedValues: `{{
        this.selectedValuesArray.filter(
          selectedValue => this.options.map(option => option.value).includes(selectedValue)
        )
      }}`,
      value: `{{this.selectedValues}}`,
    };
  }

  static getWidgetType(): string {
    return "SWITCH_GROUP_WIDGET";
  }

  componentDidUpdate(prevProps: SwitchGroupWidgetProps): void {
    if (
      xor(this.props.defaultSelectedValues, prevProps.defaultSelectedValues)
        .length > 0
    ) {
      if (this.props.isDirty) {
        this.props.updateWidgetMetaProperty("isDirty", false);
      }

      this.props.updateWidgetMetaProperty(
        "selectedValuesArray",
        this.props.defaultSelectedValues,
      );
    }
  }

  getPageView() {
    const {
      accentColor,
      alignment,
      bottomRow,
      isDisabled,
      isInline,
      isRequired,
      isValid,
      labelAlignment,
      labelPosition,
      labelStyle,
      labelText,
      labelTextColor,
      labelTextSize,
      options,
      selectedValues,
      topRow,
      widgetId,
    } = this.props;

    const { componentHeight } = this.getComponentDimensions();

    return (
      <SwitchGroupComponent
        accentColor={accentColor}
        alignment={alignment}
        compactMode={!((bottomRow - topRow) / GRID_DENSITY_MIGRATION_V1 > 1)}
        disabled={isDisabled}
        height={componentHeight}
        inline={isInline}
        labelAlignment={labelAlignment}
        labelPosition={labelPosition}
        labelStyle={labelStyle}
        labelText={labelText}
        labelTextColor={labelTextColor}
        labelTextSize={labelTextSize}
        labelWidth={this.getLabelWidth()}
        onChange={this.handleSwitchStateChange}
        options={options}
        required={isRequired}
        selected={selectedValues}
        valid={isValid}
        widgetId={widgetId}
      />
    );
  }

  private handleSwitchStateChange = (value: string) => {
    return (event: React.FormEvent<HTMLElement>) => {
      let { selectedValuesArray } = this.props;
      const isChecked = (event.target as HTMLInputElement).checked;
      if (isChecked) {
        selectedValuesArray = [...selectedValuesArray, value];
      } else {
        selectedValuesArray = selectedValuesArray.filter(
          (item: string) => item !== value,
        );
      }

      if (!this.props.isDirty) {
        this.props.updateWidgetMetaProperty("isDirty", true);
      }

      this.props.updateWidgetMetaProperty(
        "selectedValuesArray",
        selectedValuesArray,
        {
          triggerPropertyName: "onSelectionChange",
          dynamicString: this.props.onSelectionChange,
          event: {
            type: EventType.ON_SWITCH_GROUP_SELECTION_CHANGE,
          },
        },
      );
    };
  };
}

export interface SwitchGroupWidgetProps extends WidgetProps {
  options: OptionProps[];
  defaultSelectedValues: string[];
  selectedValuesArray: string[];
  isInline: boolean;
  isRequired: boolean;
  isValid: boolean;
  isDisabled: boolean;
  alignment: Alignment;
  labelText?: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth?: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  onSelectionChange?: string;
  accentColor: string;
}

export default SwitchGroupWidget;
