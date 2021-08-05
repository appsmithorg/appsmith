import React from "react";
import * as Sentry from "@sentry/react";
import { Alignment } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";

import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import ButtonComponent, {
  ButtonStyle,
  ButtonStyleTypes,
  ButtonType,
  ButtonVariant,
} from "components/designSystems/blueprint/ButtonComponent";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import withMeta, { WithMeta } from "./MetaHOC";
import { ButtonBoxShadow } from "components/propertyControls/BoxShadowOptionsControl";
import {
  ButtonBorderRadius,
  ButtonBorderRadiusTypes,
} from "components/propertyControls/BorderRadiusOptionsControl";

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
      {
        sectionName: "Styles",
        children: [
          {
            propertyName: "buttonStyle",
            label: "Button Style",
            controlType: "DROP_DOWN",
            helpText: "Changes the style of the button",
            options: [
              {
                label: "Primary",
                value: "PRIMARY",
              },
              {
                label: "Warning",
                value: "WARNING",
              },
              {
                label: "Danger",
                value: "DANGER",
              },
              {
                label: "Info",
                value: "INFO",
              },
              {
                label: "Secondary",
                value: "SECONDARY",
              },
              {
                label: "Custom",
                value: "CUSTOM",
              },
            ],
            updateHook: (
              props: ButtonWidgetProps,
              propertyPath: string,
              propertyValue: string,
            ) => {
              let propertiesToUpdate = [
                { propertyPath, propertyValue },
                { propertyPath: "prevButtonStyle", propertyValue },
              ];

              if (propertyValue === "CUSTOM") {
                propertiesToUpdate = [{ propertyPath, propertyValue }];
              }

              propertiesToUpdate.push({
                propertyPath: "backgroundColor",
                propertyValue: "",
              });

              return propertiesToUpdate;
            },
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  "PRIMARY",
                  "WARNING",
                  "DANGER",
                  "INFO",
                  "SECONDARY",
                  "CUSTOM",
                ],
              },
            },
          },
          {
            propertyName: "buttonColor",
            helpText:
              "Sets the custom color preset based on the button variant",
            label: "Button Color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
            hidden: (props: ButtonWidgetProps) =>
              props.buttonStyle !== ButtonStyleTypes.CUSTOM,
          },
          {
            propertyName: "buttonVariant",
            label: "Button Variant",
            controlType: "DROP_DOWN",
            helpText: "Sets the variant of the icon button",
            options: [
              {
                label: "Solid",
                value: "SOLID",
              },
              {
                label: "Outline",
                value: "OUTLINE",
              },
              {
                label: "Ghost",
                value: "GHOST",
              },
            ],
            isJSConvertible: true,
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedVAlues: ["SOLID", "OUTLINE", "GHOST"],
              },
            },
          },
          {
            propertyName: "borderRadius",
            label: "Border Radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            options: [
              ButtonBorderRadiusTypes.SHARP,
              ButtonBorderRadiusTypes.ROUNDED,
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ["CIRCLE", "SHARP", "ROUNDED"],
              },
            },
          },
          {
            propertyName: "boxShadow",
            label: "Box Shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  "NONE",
                  "VARIANT1",
                  "VARIANT2",
                  "VARIANT3",
                  "VARIANT4",
                  "VARIANT5",
                ],
              },
            },
          },
          {
            propertyName: "boxShadowColor",
            helpText: "Sets the shadow color of the widget",
            label: "Shadow Color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
          },
          {
            propertyName: "iconName",
            label: "Icon",
            helpText: "Sets the icon to be used for the button",
            controlType: "ICON_SELECT",
            isBindProperty: false,
            isTriggerProperty: false,
            updateHook: (
              props: ButtonWidgetProps,
              propertyPath: string,
              propertyValue: string,
            ) => {
              const propertiesToUpdate = [{ propertyPath, propertyValue }];
              if (!props.iconAlign) {
                propertiesToUpdate.push({
                  propertyPath: "iconAlign",
                  propertyValue: Alignment.LEFT,
                });
              }
              return propertiesToUpdate;
            },
            validation: {
              type: ValidationTypes.TEXT,
            },
          },
          {
            propertyName: "iconAlign",
            label: "Icon Alignment",
            helpText: "Sets the icon alignment of the button",
            controlType: "ICON_ALIGN",
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ["center", "left", "right"],
              },
            },
          },
        ],
      },
    ];
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      prevButtonStyle: "buttonStyle",
    };
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
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        boxShadowColor={this.props.boxShadowColor}
        buttonColor={this.props.buttonColor}
        buttonStyle={this.props.buttonStyle}
        buttonVariant={this.props.buttonVariant}
        clickWithRecaptcha={this.clickWithRecaptchaBound}
        googleRecaptchaKey={this.props.googleRecaptchaKey}
        handleRecaptchaV2Loading={this.handleRecaptchaV2Loading}
        iconAlign={this.props.iconAlign}
        iconName={this.props.iconName}
        isDisabled={this.props.isDisabled}
        isLoading={this.props.isLoading || this.state.isLoading}
        key={this.props.widgetId}
        onClick={!this.props.isDisabled ? this.onButtonClickBound : undefined}
        prevButtonStyle={this.props.prevButtonStyle}
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

export interface ButtonWidgetProps extends WidgetProps, WithMeta {
  text?: string;
  onClick?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  recaptchaV2?: boolean;
  buttonType?: ButtonType;
  googleRecaptchaKey?: string;
  buttonStyle?: ButtonStyle;
  prevButtonStyle?: ButtonStyle;
  buttonVariant?: ButtonVariant;
  buttonColor?: string;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
}

interface ButtonWidgetState extends WidgetState {
  isLoading: boolean;
}

export default ButtonWidget;
export const ProfiledButtonWidget = Sentry.withProfiler(withMeta(ButtonWidget));
