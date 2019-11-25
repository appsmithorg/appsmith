import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import ButtonComponent from "components/designSystems/blueprint/ButtonComponent";
import { ActionPayload } from "constants/ActionConstants";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";

class ButtonWidget extends BaseWidget<ButtonWidgetProps, WidgetState> {
  onButtonClickBound: (event: React.MouseEvent<HTMLElement>) => void;

  constructor(props: ButtonWidgetProps) {
    super(props);
    this.onButtonClickBound = this.onButtonClick.bind(this);
  }

  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      text: VALIDATION_TYPES.TEXT,
      isDisabled: VALIDATION_TYPES.BOOLEAN,
      isVisible: VALIDATION_TYPES.BOOLEAN,
      buttonStyle: VALIDATION_TYPES.TEXT,
    };
  }

  onButtonClick() {
    super.executeAction(this.props.onClick);
  }

  getPageView() {
    return (
      <ButtonComponent
        buttonStyle={this.props.buttonStyle}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        widgetName={this.props.widgetName}
        text={this.props.text}
        disabled={this.props.isDisabled}
        onClick={this.onButtonClickBound}
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
