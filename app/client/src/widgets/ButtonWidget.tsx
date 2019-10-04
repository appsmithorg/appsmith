import * as React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import ButtonComponent from "../editorComponents/ButtonComponent";
import { ActionPayload } from "../constants/ActionConstants";

class ButtonWidget extends BaseWidget<ButtonWidgetProps, WidgetState> {
  onButtonClick() {
    super.executeAction(this.props.onClick);
  }

  getPageView() {
    return (
      <ButtonComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        widgetName={this.props.widgetName}
        key={this.props.widgetId}
        text={this.props.text}
        onClick={() => {
          this.onButtonClick();
        }}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "BUTTON_WIDGET";
  }
}

export type ButtonStyle =
  | "PRIMARY_BUTTON"
  | "SECONDARY_BUTTON"
  | "SUCCESS_BUTTON"
  | "DANGER_BUTTON";

export interface ButtonWidgetProps extends WidgetProps {
  text?: string;
  buttonStyle?: ButtonStyle;
  onClick?: ActionPayload[];
  isDisabled?: boolean;
}

export default ButtonWidget;
