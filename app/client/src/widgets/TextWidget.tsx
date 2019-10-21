import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import TextViewComponent from "../components/canvas/TextViewComponent";

class TextWidget extends BaseWidget<TextWidgetProps, WidgetState> {
  getPageView() {
    return (
      <TextViewComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        text={this.props.text}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "TEXT_WIDGET";
  }
}

export type TextStyle = "BODY" | "HEADING" | "LABEL" | "SUB_TEXT";

export interface TextWidgetProps extends WidgetProps {
  text?: string;
  textStyle?: TextStyle;
}

export default TextWidget;
