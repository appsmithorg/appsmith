import React from "react";
import { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import {
  EventType,
  ExecutionResult,
} from "constants/AppsmithActionConstants/ActionConstants";
import ButtonComponent, { ButtonType } from "widgets/ButtonWidget/component";
import { ValidationTypes } from "constants/WidgetValidation";
import ButtonWidget from "widgets/ButtonWidget";
import {
  ButtonBorderRadius,
  ButtonBoxShadow,
  ButtonVariant,
  RecaptchaType,
  RecaptchaTypes,
} from "components/constants";
import { IconName } from "@blueprintjs/icons";
import { Alignment } from "@blueprintjs/core";

class FormButtonWidget extends ButtonWidget {
  constructor(props: FormButtonWidgetProps) {
    super(props);
  }

  static getPropertyPaneConfig() {
    const buttonPropertyPaneConfig = super.getPropertyPaneConfig().slice(1);
    buttonPropertyPaneConfig.unshift({
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
          validation: { type: ValidationTypes.TEXT },
        },
        {
          helpText: "Show helper text with button on hover",
          propertyName: "tooltip",
          label: "Tooltip",
          controlType: "INPUT_TEXT",
          placeholderText: "Enter tooltip text",
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.TEXT },
        },
        {
          helpText:
            "Disables the button when the parent form has a required widget that is not filled",
          propertyName: "disabledWhenInvalid",
          label: "Disabled Invalid Forms",
          controlType: "SWITCH",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.BOOLEAN },
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
          validation: { type: ValidationTypes.BOOLEAN },
        },
        {
          propertyName: "isVisible",
          label: "Visible",
          helpText: "Controls the visibility of the widget",
          controlType: "SWITCH",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.BOOLEAN },
        },
        {
          propertyName: "animateLoading",
          label: "Animate Loading",
          controlType: "SWITCH",
          helpText: "Controls the loading of the widget",
          defaultValue: true,
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.BOOLEAN },
        },
        {
          propertyName: "googleRecaptchaKey",
          label: "Google Recaptcha Key",
          helpText: "Sets Google Recaptcha v3 site key for button",
          controlType: "INPUT_TEXT",
          placeholderText: "Enter google recaptcha key",
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.TEXT },
        },
        {
          propertyName: "recaptchaType",
          label: "Google reCAPTCHA Version",
          controlType: "DROP_DOWN",
          helpText: "Select reCAPTCHA version",
          options: [
            {
              label: "reCAPTCHA v3",
              value: RecaptchaTypes.V3,
            },
            {
              label: "reCAPTCHA v2",
              value: RecaptchaTypes.V2,
            },
          ],
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.TEXT,
            params: {
              allowedValues: [RecaptchaTypes.V3, RecaptchaTypes.V2],
              default: RecaptchaTypes.V3,
            },
          },
        },
      ],
    });
    return buttonPropertyPaneConfig;
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
        {...super.getPageView().props}
        isDisabled={disabled}
        onClick={!disabled ? this.onButtonClickBound : undefined}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "FORM_BUTTON_WIDGET";
  }
}

export interface FormButtonWidgetProps extends WidgetProps {
  text?: string;
  onClick?: string;
  isVisible?: boolean;
  buttonType: ButtonType;
  isFormValid?: boolean;
  resetFormOnClick?: boolean;
  onReset?: () => void;
  disabledWhenInvalid?: boolean;
  googleRecaptchaKey?: string;
  recaptchaType: RecaptchaType;
  buttonVariant?: ButtonVariant;
  buttonColor?: string;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
}

export interface FormButtonWidgetState extends WidgetState {
  isLoading: boolean;
}

export default FormButtonWidget;
