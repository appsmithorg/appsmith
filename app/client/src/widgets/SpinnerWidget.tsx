import React from "react";
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import { Intent } from "@blueprintjs/core";
import SpinnerComponent from "../editorComponents/SpinnerComponent";

class SpinnerWidget extends BaseWidget<SpinnerWidgetProps, IWidgetState> {

  getPageView() {
    return (
      <SpinnerComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
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

export interface SpinnerWidgetProps extends IWidgetProps {
  size?: number;
  value?: number;
  ellipsize?: boolean;
  intent?: Intent;
}

export default SpinnerWidget;
