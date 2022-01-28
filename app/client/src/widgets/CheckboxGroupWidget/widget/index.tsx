import React from "react";
import { compact } from "lodash";

import { ValidationTypes } from "constants/WidgetValidation";
import { WidgetType } from "constants/WidgetConstants";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { CheckboxGroupAlignmentTypes } from "components/constants";

import CheckboxGroupComponent from "../component";
import { OptionProps, SelectAllState, SelectAllStates } from "../constants";

class CheckboxGroupWidget extends BaseWidget<
  CheckboxGroupWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Displays a list of unique checkbox options",
            propertyName: "options",
            label: "Options",
            controlType: "INPUT_TEXT",
            placeholderText: '[{ "label": "Label1", "value": "Value1" }]',
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
        sectionName: "Styles",
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

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedValuesArray: "defaultSelectedValues",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedValuesArray: undefined,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{ this.isRequired ? !!this.selectedValues.length : true }}`,
      selectedValues: `{{
        this.selectedValuesArray.filter(
          selectedValue => this.options.map(
            option => option.value).includes(selectedValue)
        )
      }}`,
    };
  }

  getPageView() {
    return (
      <CheckboxGroupComponent
        isDisabled={this.props.isDisabled}
        isInline={this.props.isInline}
        isRequired={this.props.isRequired}
        isSelectAll={this.props.isSelectAll}
        isValid={this.props.isValid}
        key={this.props.widgetId}
        onChange={this.handleCheckboxChange}
        onSelectAllChange={this.handleSelectAllChange}
        optionAlignment={this.props.optionAlignment}
        options={compact(this.props.options)}
        rowSpace={this.props.parentRowSpace}
        selectedValues={compact(this.props.selectedValues)}
        widgetId={this.props.widgetId}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "CHECKBOX_GROUP_WIDGET";
  }

  private handleCheckboxChange = (value: string) => {
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

      this.props.updateWidgetMetaProperty(
        "selectedValuesArray",
        selectedValuesArray,
        {
          triggerPropertyName: "onSelectionChange",
          dynamicString: this.props.onSelectionChange,
          event: {
            type: EventType.ON_CHECKBOX_GROUP_SELECTION_CHANGE,
          },
        },
      );
    };
  };

  private handleSelectAllChange = (state: SelectAllState) => {
    return () => {
      let { selectedValuesArray } = this.props;

      switch (state) {
        case SelectAllStates.UNCHECKED:
          selectedValuesArray = this.props.options.map(
            (option) => option.value,
          );
          break;

        default:
          selectedValuesArray = [];
          break;
      }

      this.props.updateWidgetMetaProperty(
        "selectedValuesArray",
        selectedValuesArray,
        {
          triggerPropertyName: "onSelectionChange",
          dynamicString: this.props.onSelectionChange,
          event: {
            type: EventType.ON_CHECKBOX_GROUP_SELECTION_CHANGE,
          },
        },
      );
    };
  };
}

export interface CheckboxGroupWidgetProps extends WidgetProps {
  options: OptionProps[];
  selectedValuesArray: string[];
  isInline: boolean;
  isSelectAll?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  isValid?: boolean;
  onCheckChanged?: string;
  optionAlignment?: string;
}

export default CheckboxGroupWidget;
