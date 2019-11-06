import * as React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import RadioGroupComponent from "../components/designSystems/blueprint/RadioGroupComponent";
import { ActionPayload } from "../constants/ActionConstants";

class RadioGroupWidget extends BaseWidget<RadioGroupWidgetProps, WidgetState> {
  getPageView() {
    return (
      <RadioGroupComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        onRadioSelectionChange={this.onRadioSelectionChange}
        key={this.props.widgetId}
        label={this.props.label}
        selectedOptionValue={this.props.selectedOptionValue}
        options={this.props.options}
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
}

export interface RadioGroupWidgetProps extends WidgetProps {
  label: string;
  options: RadioOption[];
  selectedOptionValue: string;
  onSelectionChange?: ActionPayload[];
}

export default RadioGroupWidget;
