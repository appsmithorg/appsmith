import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import ButtonComponent, {
  ButtonType,
} from "components/designSystems/blueprint/ButtonComponent";
import { EventType } from "constants/ActionConstants";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { TriggerPropertiesMap } from "utils/WidgetFactory";

class ButtonWidget extends BaseWidget<
  ButtonWidgetProps,
  WidgetState & { isLoading: boolean }
> {
  onButtonClickBound: (event: React.MouseEvent<HTMLElement>) => void;

  constructor(props: ButtonWidgetProps) {
    super(props);
    this.onButtonClickBound = this.onButtonClick.bind(this);
    this.state = {
      // TODO these values dont have any bearing on the actual component height
      // at this level. The widget state should not define this
      componentHeight: 0,
      componentWidth: 0,
      meta: {},
      isLoading: false,
    };
  }

  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      text: VALIDATION_TYPES.TEXT,
      buttonStyle: VALIDATION_TYPES.TEXT,
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onClick: true,
    };
  }

  onButtonClick() {
    if (this.props.onClick) {
      this.setState({
        isLoading: true,
      });
      super.executeAction({
        dynamicString: this.props.onClick,
        event: {
          type: EventType.ON_CLICK,
          callback: this.handleActionComplete,
        },
      });
    }
  }

  handleActionComplete = () => {
    this.setState({
      isLoading: false,
    });
  };

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
        isLoading={this.props.isLoading || this.state.isLoading}
        type={this.props.buttonType || ButtonType.BUTTON}
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
  onClick?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  buttonType?: ButtonType;
}

export default ButtonWidget;
