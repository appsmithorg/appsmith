import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import TextComponent from "../components/designSystems/blueprint/TextComponent";

class TextWidget extends BaseWidget<TextWidgetProps, WidgetState> {
  getPageView() {
    return (
      <TextComponent
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        textStyle={this.props.textStyle}
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
  textStyle: TextStyle;
}

export default TextWidget;
