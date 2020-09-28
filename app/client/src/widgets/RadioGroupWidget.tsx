import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import RadioGroupComponent from "components/designSystems/blueprint/RadioGroupComponent";
import { EventType } from "constants/ActionConstants";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import { ActionDescription } from "../entities/DataTree/dataTreeFactory";

class RadioGroupWidget extends BaseWidget<RadioGroupWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      label: VALIDATION_TYPES.TEXT,
      options: VALIDATION_TYPES.OPTIONS_DATA,
      selectedOptionValue: VALIDATION_TYPES.TEXT,
      defaultOptionValue: VALIDATION_TYPES.TEXT,
      isRequired: VALIDATION_TYPES.BOOLEAN,
      // onSelectionChange: VALIDATION_TYPES.ACTION_SELECTOR,
    };
  }
  static getDerivedPropertiesMap() {
    return {
      selectedOption:
        "{{_.find(this.options, { value: this.selectedOptionValue })}}",
      isValid: `{{ this.isRequired ? !!this.selectedOptionValue : true }}`,
      value: `{{this.selectedOptionValue}}`,
    };
  }
  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onSelectionChange: true,
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
        widgetId={this.props.widgetId}
        onRadioSelectionChange={this.onRadioSelectionChange}
        key={this.props.widgetId}
        label={`${this.props.label}`}
        selectedOptionValue={this.props.selectedOptionValue}
        options={this.props.options}
        isLoading={this.props.isLoading}
        isDisabled={this.props.isDisabled}
      />
    );
  }

  onRadioSelectionChange = (updatedValue: string) => {
    this.props.updateWidgetMetaProperty("selectedOptionValue", updatedValue, {
      triggers: this.props.onSelectionChange,
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
  onSelectionChange: ActionDescription<any>[];
  defaultOptionValue: string;
  isRequired?: boolean;
}

export default RadioGroupWidget;
export const ProfiledRadioGroupWidget = Sentry.withProfiler(
  withMeta(RadioGroupWidget),
);
