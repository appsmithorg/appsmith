import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import TextComponent from "components/designSystems/blueprint/TextComponent";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";

const LINE_HEIGHTS: { [key in TextStyle]: number } = {
  // The following values are arrived at by multiplying line-height with font-size
  BODY: 1.5 * 14,
  HEADING: 1.28581 * 16,
  LABEL: 1.28581 * 14,
  SUB_TEXT: 1.28581 * 12,
};

class TextWidget extends BaseWidget<TextWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      text: VALIDATION_TYPES.TEXT,
      textStyle: VALIDATION_TYPES.TEXT,
    };
  }

  getNumberOfLines() {
    const height = (this.props.bottomRow - this.props.topRow) * 40;
    const lineHeight = LINE_HEIGHTS[this.props.textStyle];
    return Math.floor(height / lineHeight);
  }

  getPageView() {
    // const lines = this.getNumberOfLines();
    return (
      <TextComponent
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        textStyle={this.props.textStyle}
        text={this.props.text}
        isLoading={this.props.isLoading}
        shouldScroll={this.props.shouldScroll}
        // lines={lines}
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
  isLoading: boolean;
  shouldScroll: boolean;
}

export default TextWidget;
