import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import RadioGroupComponent from "components/designSystems/blueprint/RadioGroupComponent";
import { ActionPayload } from "constants/ActionConstants";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";

class RadioGroupWidget extends BaseWidget<RadioGroupWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      label: VALIDATION_TYPES.TEXT,
      options: VALIDATION_TYPES.ARRAY,
      selectedOptionValue: VALIDATION_TYPES.TEXT,
    };
  }
  static getDerivedProperties(widgetData: FlattenedWidgetProps) {
    return {
      selectedOption: widgetData.options.find(
        (opt: RadioOption) =>
          opt.value.toString() === widgetData.selectedOptionValue.toString(),
      ),
    };
  }
  static getDerivedPropertiesMap() {
    return {
      selectedOption: (widgetData: FlattenedWidgetProps) =>
        widgetData.options.find(
          (opt: RadioOption) =>
            opt.value.toString() === widgetData.selectedOptionValue.toString(),
        ),
    };
  }
  getPageView() {
    return (
      <RadioGroupComponent
        widgetId={this.props.widgetId}
        onRadioSelectionChange={this.onRadioSelectionChange}
        key={this.props.widgetId}
        label={this.props.label}
        selectedOptionValue={this.props.selectedOptionValue}
        options={this.props.options}
        isLoading={this.props.isLoading}
      />
    );
  }

  onRadioSelectionChange = (updatedValue: string) => {
    this.context.updateWidgetProperty(
      this.props.widgetId,
      "selectedOptionValue",
      updatedValue,
    );
    super.executeAction(this.props.onSelectionChange);
  };

  getWidgetType(): WidgetType {
    return "RADIO_GROUP_WIDGET";
  }
}

export interface RadioOption {
  label: string;
  value: string;
  id: string;
}

export interface RadioGroupWidgetProps extends WidgetProps {
  label: string;
  options: RadioOption[];
  selectedOptionValue: string;
  onSelectionChange?: ActionPayload[];
}

export default RadioGroupWidget;
