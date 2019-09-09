import * as React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import ButtonComponent from "../editorComponents/ButtonComponent";

class ButtonWidget extends BaseWidget<ButtonWidgetProps, WidgetState> {
  getPageView() {
    return (
      <ButtonComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        text={this.props.text || "Button"}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "BUTTON_WIDGET";
  }
}

export interface ButtonWidgetProps extends WidgetProps {
  text?: string;
  ellipsize?: boolean;
}

export default ButtonWidget;
