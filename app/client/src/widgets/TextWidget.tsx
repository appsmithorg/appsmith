import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import TextComponent from "../editorComponents/TextComponent";

class TextWidget extends BaseWidget<TextWidgetProps, WidgetState> {
  getPageView() {
    return (
      <TextComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        text={this.props.text}
        tagName={this.props.tagName}
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
  tagName?: keyof JSX.IntrinsicElements;
}

export default TextWidget;
