import * as React from "react";
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget";
import { WidgetType, CSSUnits } from "../constants/WidgetConstants";
import CalloutComponent from "../editorComponents/CalloutComponent";
import _ from "lodash";

class CalloutWidget extends BaseWidget<ICalloutWidgetProps, IWidgetState> {
  constructor(widgetProps: ICalloutWidgetProps) {
    super(widgetProps);
  }

  getWidgetView() {
    return (
      <CalloutComponent
        style={{
          positionType: "ABSOLUTE",
          yPosition: this.props.topRow * this.props.parentRowSpace,
          xPosition: this.props.leftColumn * this.props.parentColumnSpace,
          xPositionUnit: CSSUnits.PIXEL,
          yPositionUnit: CSSUnits.PIXEL
        }}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        id={this.props.id}
        heading={this.props.heading}
        description={this.props.description}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "CALLOUT_WIDGET";
  }
}

export interface ICalloutWidgetProps extends IWidgetProps {
  id?: string;
  heading?: string;
  description?: string;
  ellipsize?: boolean;
}

export default CalloutWidget;
