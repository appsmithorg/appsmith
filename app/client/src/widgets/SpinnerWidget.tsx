import * as React from "react";
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget";
import { WidgetType, CSSUnits } from "../constants/WidgetConstants";
import { Spinner, Intent } from "@blueprintjs/core";
import SpinnerComponent from "../editorComponents/SpinnerComponent";
import _ from "lodash";

class SpinnerWidget extends BaseWidget<ISpinnerWidgetProps, IWidgetState> {
  constructor(widgetProps: ISpinnerWidgetProps) {
    super(widgetProps);
  }

  getWidgetView() {
    return (
      <SpinnerComponent
        style={{
          positionType: "ABSOLUTE",
          yPosition: this.props.topRow * this.props.parentRowSpace,
          xPosition: this.props.leftColumn * this.props.parentColumnSpace,
          xPositionUnit: CSSUnits.PIXEL,
          yPositionUnit: CSSUnits.PIXEL
        }}
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

export interface ISpinnerWidgetProps extends IWidgetProps {
  size?: number;
  value?: number;
  ellipsize?: boolean;
  intent?: Intent;
}

export default SpinnerWidget;
