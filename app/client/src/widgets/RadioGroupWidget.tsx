import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import RadioGroupComponent from "components/designSystems/blueprint/RadioGroupComponent";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

class RadioGroupWidget extends BaseWidget<RadioGroupWidgetProps, WidgetState> {
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
            validation: VALIDATION_TYPES.OPTIONS_DATA,
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
          {
            helpText: "Selects a value of the options entered by default",
            propertyName: "defaultOptionValue",
            label: "Default Selected Value",
            placeholderText: "Enter option value",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText:
              "Triggers an action when a user changes the selected option",
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
  static getDerivedPropertiesMap() {
    return {
      selectedOption:
        "{{_.find(this.options, { value: this.selectedOptionValue })}}",
      isValid: `{{ this.isRequired ? !!this.selectedOptionValue : true }}`,
      value: `{{this.selectedOptionValue}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedOptionValue: "defaultOptionValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedOptionValue: undefined,
    };
  }

  getPageView() {
    return (
      <RadioGroupComponent
        isDisabled={this.props.isDisabled}
        isLoading={this.props.isLoading}
        key={this.props.widgetId}
        label={`${this.props.label}`}
        onRadioSelectionChange={this.onRadioSelectionChange}
        options={this.props.options}
        selectedOptionValue={this.props.selectedOptionValue}
        widgetId={this.props.widgetId}
      />
    );
  }

  onRadioSelectionChange = (updatedValue: string) => {
    this.props.updateWidgetMetaProperty("selectedOptionValue", updatedValue, {
      triggerPropertyName: "onSelectionChange",
      dynamicString: this.props.onSelectionChange,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });
  };

  getWidgetType(): WidgetType {
    return "RADIO_GROUP_WIDGET";
  }
}

export interface RadioOption {
  label: string;
  value: string;
}

export interface RadioGroupWidgetProps extends WidgetProps, WithMeta {
  label: string;
  options: RadioOption[];
  selectedOptionValue: string;
  onSelectionChange: string;
  defaultOptionValue: string;
  isRequired?: boolean;
}

export default RadioGroupWidget;
export const ProfiledRadioGroupWidget = Sentry.withProfiler(
  withMeta(RadioGroupWidget),
);
