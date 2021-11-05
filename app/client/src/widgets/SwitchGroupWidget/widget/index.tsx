import React from "react";
import { compact } from "lodash";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { ValidationTypes } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import SwitchGroupComponent, { OptionProps } from "../component";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { isArrayEqual } from "utils/AppsmithUtils";

class SwitchGroupWidget extends BaseWidget<
  SwitchGroupWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
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
                    // required: true,
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
                          required: true,
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
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
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
            helpText: "Disables input to the widget",
            label: "Disabled",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Actions",
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

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedValues: "defaultSelectedValues",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedValues: undefined,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{ this.isRequired ? !!this.selectedValues.length : true }}`,
    };
  }

  static getWidgetType(): string {
    return "SWITCH_GROUP_WIDGET";
  }

  componentDidUpdate(prevProps: SwitchGroupWidgetProps) {
    const prevOptionsLength = prevProps.options.length;
    const optionsLength = this.props.options.length;

    if (!isArrayEqual(this.props.options, prevProps.options)) {
      const prevOptions = compact(prevProps.options).map(
        (prevOption) => prevOption.value,
      );
      const options = compact(this.props.options).map((option) => option.value);

      let diffOptions = prevOptions.filter(
        (prevOption) => !options.includes(prevOption),
      );

      if (optionsLength >= prevOptionsLength) {
        diffOptions = options.filter((option) => !prevOptions.includes(option));
      }

      let selectedValues = this.props.selectedValues.filter(
        (selectedValue: string) => !diffOptions.includes(selectedValue),
      );

      if (optionsLength >= prevOptionsLength) {
        const defaultSelectedValues = this.props.defaultSelectedValues;
        selectedValues = selectedValues.concat(
          defaultSelectedValues.filter((defaultSelectedValue: string) =>
            diffOptions.includes(defaultSelectedValue),
          ),
        );
      }

      this.props.updateWidgetMetaProperty("selectedValues", selectedValues, {
        triggerPropertyName: "onSelectionChange",
        dynamicString: this.props.onSelectionChange,
        event: {
          type: EventType.ON_SWITCH_GROUP_SELECTION_CHANGE,
        },
      });
    }
  }

  getPageView() {
    const {
      isDisabled,
      isInline,
      isRequired,
      isValid,
      options,
      parentRowSpace,
      selectedValues,
    } = this.props;

    return (
      <SwitchGroupComponent
        disabled={isDisabled}
        inline={isInline}
        onChange={this.handleSwitchStateChange}
        options={options}
        required={isRequired}
        rowSpace={parentRowSpace}
        selected={selectedValues}
        valid={isValid}
      />
    );
  }

  private handleSwitchStateChange = (value: string) => {
    return (event: React.FormEvent<HTMLElement>) => {
      let { selectedValues } = this.props;
      const isChecked = (event.target as HTMLInputElement).checked;
      if (isChecked) {
        selectedValues = [...selectedValues, value];
      } else {
        selectedValues = selectedValues.filter(
          (item: string) => item !== value,
        );
      }

      this.props.updateWidgetMetaProperty("selectedValues", selectedValues, {
        triggerPropertyName: "onSelectionChange",
        dynamicString: this.props.onSelectionChange,
        event: {
          type: EventType.ON_SWITCH_GROUP_SELECTION_CHANGE,
        },
      });
    };
  };
}

export interface SwitchGroupWidgetProps extends WidgetProps {
  options: OptionProps[];
  defaultSelectedValues: string[];
  isInline: boolean;
  isRequired?: boolean;
  isValid?: boolean;
  isDisabled?: boolean;
  onSelectionChange?: boolean;
}

export default SwitchGroupWidget;
