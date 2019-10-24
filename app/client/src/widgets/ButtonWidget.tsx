import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import ButtonComponent, { ButtonStyleName } from "../components/canvas/Button";
import { ActionPayload } from "../constants/ActionConstants";

class ButtonWidget extends BaseWidget<ButtonWidgetProps, WidgetState> {
  onButtonClick() {
    super.executeAction(this.props.onClick);
  }

  getPageView() {
    // TODO(abhinav): This is a hack. Need to standardize the style names
    const translatedButtonStyleName: ButtonStyleName | undefined =
      this.props.buttonStyle &&
      (this.props.buttonStyle.split("_")[0].toLowerCase() as ButtonStyleName);
    return (
      <ButtonComponent
        style={this.getPositionStyle()}
        styleName={translatedButtonStyleName}
        widgetId={this.props.widgetId}
        widgetName={this.props.widgetName}
        key={this.props.widgetId}
        text={this.props.text}
        disabled={this.props.isDisabled}
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
  isVisible?: boolean;
}

export default ButtonWidget;
