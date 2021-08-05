import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import ButtonComponent, {
  ButtonType,
} from "components/designSystems/blueprint/ButtonComponent";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";

class ButtonWidget extends BaseWidget<ButtonWidgetProps, ButtonWidgetState> {
  onButtonClickBound: (event: React.MouseEvent<HTMLElement>) => void;
  clickWithRecaptchaBound: (token: string) => void;
  constructor(props: ButtonWidgetProps) {
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
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "buttonStyle",
            label: "Button Style",
            controlType: "DROP_DOWN",
            helpText: "Changes the style of the button",
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
            isJSConvertible: true,
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  "PRIMARY_BUTTON",
                  "SECONDARY_BUTTON",
                  "DANGER_BUTTON",
                ],
              },
            },
          },
          {
            helpText: "Show help text or details about current button",
            propertyName: "tooltip",
            label: "Tooltip",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter tooltip text",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
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
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            helpText: "Disables clicks to this widget",
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
            propertyName: "recaptchaV2",
            label: "Google reCAPTCHA v2",
            controlType: "SWITCH",
            helpText: "Use reCAPTCHA v2",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
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

  onButtonClick(e: React.MouseEvent<HTMLElement>) {
    e.stopPropagation();

    if (this.props.onClick) {
      this.setState({
        isLoading: true,
      });
      super.executeAction({
        triggerPropertyName: "onClick",
        dynamicString: this.props.onClick,
        event: {
          type: EventType.ON_CLICK,
          callback: this.handleActionComplete,
        },
      });
    }
  }

  clickWithRecaptcha(token: string) {
    this.props.updateWidgetMetaProperty("recaptchaToken", token, {
      triggerPropertyName: "onClick",
      dynamicString: this.props.onClick,
      event: {
        type: EventType.ON_CLICK,
        callback: this.handleActionComplete,
      },
    });
  }

  handleRecaptchaV2Loading = (isLoading: boolean) => {
    if (this.props.onClick) {
      this.setState({ isLoading });
    }
  };

  handleActionComplete = () => {
    this.setState({
      isLoading: false,
    });
  };

  getPageView() {
    return (
      <ButtonComponent
        buttonStyle={this.props.buttonStyle}
        clickWithRecaptcha={this.clickWithRecaptchaBound}
        disabled={this.props.isDisabled}
        googleRecaptchaKey={this.props.googleRecaptchaKey}
        handleRecaptchaV2Loading={this.handleRecaptchaV2Loading}
        isLoading={this.props.isLoading || this.state.isLoading}
        key={this.props.widgetId}
        onClick={!this.props.isDisabled ? this.onButtonClickBound : undefined}
        recaptchaV2={this.props.recaptchaV2}
        text={this.props.text}
        tooltip={this.props.tooltip}
        type={this.props.buttonType || ButtonType.BUTTON}
        widgetId={this.props.widgetId}
        widgetName={this.props.widgetName}
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

export interface ButtonWidgetProps extends WidgetProps, WithMeta {
  text?: string;
  buttonStyle?: ButtonStyle;
  onClick?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  recaptchaV2?: boolean;
  buttonType?: ButtonType;
  googleRecaptchaKey?: string;
}

interface ButtonWidgetState extends WidgetState {
  isLoading: boolean;
}

export default ButtonWidget;
export const ProfiledButtonWidget = Sentry.withProfiler(withMeta(ButtonWidget));
