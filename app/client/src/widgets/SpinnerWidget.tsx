import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import { Intent } from "@blueprintjs/core";
import SpinnerComponent from "../components/designSystems/blueprint/SpinnerComponent";

class SpinnerWidget extends BaseWidget<SpinnerWidgetProps, WidgetState> {
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
