import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import TextComponent from "components/designSystems/blueprint/TextComponent";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";

class TextWidget extends BaseWidget<TextWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      text: VALIDATION_TYPES.TEXT,
      textStyle: VALIDATION_TYPES.TEXT,
    };
  }

  getPageView() {
    return (
      <TextComponent
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        textStyle={this.props.textStyle}
        text={this.props.text}
        isLoading={this.props.isLoading}
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
}

export default TextWidget;
