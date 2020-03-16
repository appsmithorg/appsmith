import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { Intent } from "@blueprintjs/core";
import SpinnerComponent from "components/designSystems/blueprint/SpinnerComponent";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";

class SpinnerWidget extends BaseWidget<SpinnerWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      size: VALIDATION_TYPES.NUMBER,
      value: VALIDATION_TYPES.NUMBER,
      ellipsize: VALIDATION_TYPES.BOOLEAN,
    };
  }
  getPageView() {
    return (
      <SpinnerComponent
        widgetId={this.props.widgetId}
        widgetName={this.props.widgetName}
        key={this.props.widgetId}
        size={this.props.size}
        value={this.props.value}
        intent={this.props.intent}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "SPINNER_WIDGET";
  }
}

export interface SpinnerWidgetProps extends WidgetProps {
  size?: number;
  value?: number;
  ellipsize?: boolean;
  intent?: Intent;
}

export default SpinnerWidget;
