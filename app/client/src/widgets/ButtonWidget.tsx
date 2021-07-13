import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import ButtonComponent, {
  ButtonType,
} from "components/designSystems/blueprint/ButtonComponent";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
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
            validation: VALIDATION_TYPES.TEXT,
          },
          {
            propertyName: "backgroundColor",
            helpText: "Sets the background color of the widget",
            label: "Background Color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "textColor",
            helpText: "Sets the text color of the widget",
            label: "Text Color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
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
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "buttonVariant",
            label: "Button Variant",
            controlType: "DROP_DOWN",
            helpText: "Sets the variant of the icon button",
            options: [
              {
                label: "Contained",
                value: "CONTAINED",
              },
              {
                label: "Outlined",
                value: "OUTLINED",
              },
              {
                label: "Text",
                value: "TEXT",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "buttonSize",
            label: "Size",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Large",
                value: "LARGE",
              },
              {
                label: "Medium",
                value: "MEDIUM",
              },
              {
                label: "Small",
                value: "SMALL",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "boxShadow",
            label: "Box Shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isBindProperty: false,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
          },
          {
            propertyName: "boxShadowColor",
            helpText: "Sets the shadow color of the widget",
            label: "Shadow Color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "iconName",
            label: "Icon",
            helpText: "Sets the icon to be used for the button",
            controlType: "ICON_SELECT",
            isBindProperty: false,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
          },
          {
            propertyName: "iconColor",
            helpText: "Sets the icon color of the button",
            label: "Icon Color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "iconAlign",
            label: "Icon Alignment",
            helpText: "Sets the icon alignment of the button",
            controlType: "ICON_ALIGN",
            isBindProperty: false,
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
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            helpText: "Disables clicks to this widget",
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
        callback: this.handleActionComplete,
      },
    });
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
        clickWithRecaptcha={this.clickWithRecaptchaBound}
        disabled={this.props.isDisabled}
        googleRecaptchaKey={this.props.googleRecaptchaKey}
        isLoading={this.props.isLoading || this.state.isLoading}
        key={this.props.widgetId}
        onClick={!this.props.isDisabled ? this.onButtonClickBound : undefined}
        recaptchaV2={this.props.recaptchaV2}
        text={this.props.text}
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
