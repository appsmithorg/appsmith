import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import ButtonComponent, {
  ButtonType,
} from "components/designSystems/blueprint/ButtonComponent";
import {
  EventType,
  ExecutionResult,
} from "constants/AppsmithActionConstants/ActionConstants";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";

class FormButtonWidget extends BaseWidget<
  FormButtonWidgetProps,
  FormButtonWidgetState
> {
  onButtonClickBound: (event: React.MouseEvent<HTMLElement>) => void;
  clickWithRecaptchaBound: (token: string) => void;

  constructor(props: FormButtonWidgetProps) {
    super(props);
    this.onButtonClickBound = this.onButtonClick.bind(this);
    this.clickWithRecaptchaBound = this.clickWithRecaptcha.bind(this);
    this.state = {
      isLoading: false,
    };
  }

  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "text",
            label: "Label",
            helpText: "Sets the label of the button",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter label text",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
          },
          {
            propertyName: "buttonStyle",
            label: "Button Style",
            helpText: "Changes the style of the button",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Primary Button",
                value: "PRIMARY_BUTTON",
              },
              {
                label: "Secondary Button",
                value: "SECONDARY_BUTTON",
              },
              {
                label: "Danger Button",
                value: "DANGER_BUTTON",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            helpText:
              "Disables the button when the parent form has a required widget that is not filled",
            propertyName: "disabledWhenInvalid",
            label: "Disabled Invalid Forms",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            helpText:
              "Resets the fields within the parent form when the click action succeeds",
            propertyName: "resetFormOnClick",
            label: "Reset Form on Success",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            propertyName: "googleRecaptchaKey",
            label: "Google Recaptcha Key",
            helpText: "Sets Google Recaptcha v3 site key for button",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter google recaptcha key",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
          },
          {
            propertyName: "recaptchaV2",
            label: "Google reCAPTCHA v2",
            controlType: "SWITCH",
            helpText: "Use reCAPTCHA v2",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the button is clicked",
            propertyName: "onClick",
            label: "onClick",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      recaptchaToken: undefined,
    };
  }

  clickWithRecaptcha(token: string) {
    if (this.props.onClick) {
      this.setState({
        isLoading: true,
      });
    }
    this.props.updateWidgetMetaProperty("recaptchaToken", token, {
      triggerPropertyName: "onClick",
      dynamicString: this.props.onClick,
      event: {
        type: EventType.ON_CLICK,
        callback: this.handleActionResult,
      },
    });
  }

  onButtonClick() {
    if (this.props.onClick) {
      this.setState({
        isLoading: true,
      });
      super.executeAction({
        triggerPropertyName: "onClick",
        dynamicString: this.props.onClick,
        event: {
          type: EventType.ON_CLICK,
          callback: this.handleActionResult,
        },
      });
    } else if (this.props.resetFormOnClick && this.props.onReset) {
      this.props.onReset();
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
        clickWithRecaptcha={this.clickWithRecaptchaBound}
        disabled={disabled}
        googleRecaptchaKey={this.props.googleRecaptchaKey}
        isLoading={this.props.isLoading || this.state.isLoading}
        key={this.props.widgetId}
        onClick={!disabled ? this.onButtonClickBound : undefined}
        recaptchaV2={this.props.recaptchaV2}
        text={this.props.text}
        type={this.props.buttonType || ButtonType.BUTTON}
        widgetId={this.props.widgetId}
        widgetName={this.props.widgetName}
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

export interface FormButtonWidgetProps extends WidgetProps, WithMeta {
  text?: string;
  buttonStyle?: ButtonStyle;
  onClick?: string;
  isVisible?: boolean;
  buttonType: ButtonType;
  isFormValid?: boolean;
  resetFormOnClick?: boolean;
  onReset?: () => void;
  disabledWhenInvalid?: boolean;
  googleRecaptchaKey?: string;
  recaptchaV2?: boolean;
}

export interface FormButtonWidgetState extends WidgetState {
  isLoading: boolean;
}

export default FormButtonWidget;
export const ProfiledFormButtonWidget = Sentry.withProfiler(
  withMeta(FormButtonWidget),
);
