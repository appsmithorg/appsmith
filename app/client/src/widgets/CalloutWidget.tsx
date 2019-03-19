import * as React from "react";
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget";
import { Callout, Code, H5, Intent, Switch } from "@blueprintjs/core";
import { WidgetType, CSSUnits } from "../constants/WidgetConstants";
import CalloutComponent from "../editorComponents/CalloutComponent";
import _ from "lodash";

class CalloutWidget extends BaseWidget<ICalloutWidgetProps, IWidgetState> {
  constructor(widgetProps: ICalloutWidgetProps) {
    super(widgetProps);
  }

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

export interface ICalloutWidgetProps extends IWidgetProps {
  id?: string;
  title?: string;
  description?: string;
  intent?: Intent;
  ellipsize?: boolean;
}

export default CalloutWidget;
