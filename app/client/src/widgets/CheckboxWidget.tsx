import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import CheckboxComponent from "../components/designSystems/blueprint/CheckboxComponent";
import { ActionPayload } from "../constants/ActionConstants";

class CheckboxWidget extends BaseWidget<CheckboxWidgetProps, WidgetState> {
  getPageView() {
    return (
      <CheckboxComponent
        style={this.getPositionStyle()}
        defaultCheckedState={this.props.defaultCheckedState}
        label={this.props.label}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        isDisabled={this.props.isDisabled}
        onCheckChange={this.onCheckChange}
      />
    );
  }

  onCheckChange = (isChecked: boolean) => {
    this.context.updateWidgetProperty(
      this.props.widgetId,
      "isChecked",
      isChecked,
    );
    super.executeAction(this.props.onCheckChange);
  };

  getWidgetType(): WidgetType {
    return "CHECKBOX_WIDGET";
  }
}

export interface CheckboxWidgetProps extends WidgetProps {
  label: string;
  defaultCheckedState: boolean;
  isChecked?: boolean;
  isDisabled?: boolean;
  onCheckChange?: ActionPayload[];
}

export default CheckboxWidget;
