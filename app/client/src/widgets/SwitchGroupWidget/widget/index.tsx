import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import SwitchGroupComponent, { OptionProps } from "../component";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

function defaultSelectedValuesValidation(
  value: unknown,
  props: SwitchGroupWidgetProps,
): ValidationResponse {
  let isValid = true;
  let values: string[] = [];
  const messages: string[] = [];
  const { options } = props;

  const optionValues = options.map((option) => option.value);

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

  values.forEach((value, index) => {
    if (!optionValues.includes(value)) {
      isValid = false;
      messages.push(`Mismatching value: ${value} at: ${index}`);
    }
  });

  if (isValid) {
    return {
      isValid: true,
      parsed: values,
    };
  }

  return {
    isValid: false,
    parsed: values,
    message: messages.join(" "),
  };
}

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
            controlType: "OPTION_INPUT",
            isJSConvertible: true,
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
                          unique: true,
                        },
                      },
                      {
                        name: "value",
                        type: ValidationTypes.TEXT,
                        params: {
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
              type: ValidationTypes.FUNCTION,
              params: {
                fn: defaultSelectedValuesValidation,
                expected: {
                  type: "Value or Array of values",
                  example: `value1 | ['value1', 'value2']`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
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
            validation: {
              type: ValidationTypes.BOOLEAN,
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
    if (
      Array.isArray(prevProps.options) &&
      Array.isArray(this.props.options) &&
      this.props.options.length !== prevProps.options.length
    ) {
      const prevOptions = prevProps.options.map(
        (prevOption) => prevOption.value,
      );
      const options = this.props.options.map((option) => option.value);

      const diffOptions = prevOptions.filter(
        (prevOption) => !options.includes(prevOption),
      );

      const selectedValues = this.props.selectedValues.filter(
        (selectedValue: string) => !diffOptions.includes(selectedValue),
      );

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
  isInline: boolean;
  isRequired?: boolean;
  isValid?: boolean;
  isDisabled?: boolean;
  onSelectionChange?: boolean;
}

export default SwitchGroupWidget;
