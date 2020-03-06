import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import ButtonComponent, {
  ButtonType,
} from "components/designSystems/blueprint/ButtonComponent";
import { EventType, ExecutionResult } from "constants/ActionConstants";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { TriggerPropertiesMap } from "utils/WidgetFactory";

class FormButtonWidget extends BaseWidget<
  FormButtonWidgetProps,
  WidgetState & { isLoading: boolean }
> {
  onButtonClickBound: (event: React.MouseEvent<HTMLElement>) => void;

  constructor(props: FormButtonWidgetProps) {
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
      text: VALIDATION_TYPES.TEXT,
      disabledWhenInvalid: VALIDATION_TYPES.BOOLEAN,
      isVisible: VALIDATION_TYPES.BOOLEAN,
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
          callback: this.handleActionResult,
        },
      });
    }
  }

  handleActionResult = (result: ExecutionResult) => {
    this.setState({
      isLoading: false,
    });
    if (result.success) {
      if (this.props.resetFormOnClick && this.props.onReset)
        this.props.onReset();
    }
  };

  getPageView() {
    const disabled =
      this.props.disabledWhenInvalid &&
      "isFormValid" in this.props &&
      !this.props.isFormValid;

    return (
      <ButtonComponent
        buttonStyle={this.props.buttonStyle}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        widgetName={this.props.widgetName}
        text={this.props.text}
        disabled={disabled}
        onClick={this.onButtonClickBound}
        isLoading={this.props.isLoading || this.state.isLoading}
        type={ButtonType.SUBMIT}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "FORM_BUTTON_WIDGET";
  }
}

export type ButtonStyle =
  | "PRIMARY_BUTTON"
  | "SECONDARY_BUTTON"
  | "SUCCESS_BUTTON"
  | "DANGER_BUTTON";

export interface FormButtonWidgetProps extends WidgetProps {
  text?: string;
  buttonStyle?: ButtonStyle;
  onClick?: string;
  isVisible?: boolean;
  isFormValid?: boolean;
  resetFormOnClick?: boolean;
  onReset?: () => void;
  disabledWhenInvalid?: boolean;
}

export default FormButtonWidget;
