import React from "react";
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget";
import { Intent } from "@blueprintjs/core";
import { WidgetType } from "../constants/WidgetConstants";
import CalloutComponent from "../editorComponents/CalloutComponent";

class CalloutWidget extends BaseWidget<CalloutWidgetProps, IWidgetState> {
  getPageView() {
    return (
      <CalloutComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        id={this.props.id}
        title={this.props.title}
        description={this.props.description}
        intent={this.props.intent}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "CALLOUT_WIDGET";
  }
}

export interface CalloutWidgetProps extends IWidgetProps {
  id?: string;
  title?: string;
  description?: string;
  intent?: Intent;
  ellipsize?: boolean;
}

export default CalloutWidget;
