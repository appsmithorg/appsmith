import { Alignment } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";
import type {
  AutocompletionDefinitions,
  PropertyUpdates,
  SnipingModeProperty,
  WidgetCallout,
} from "WidgetProvider/constants";
import type {
  ButtonBorderRadius,
  ButtonVariant,
  RecaptchaType,
} from "components/constants";
import {
  ButtonPlacementTypes,
  ButtonVariantTypes,
  RecaptchaTypes,
} from "components/constants";
import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { Stylesheet } from "entities/AppTheming";
import { buildDeprecationWidgetMessage } from "pages/Editor/utils";
import React from "react";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import ButtonWidget from "widgets/ButtonWidget";
import type { ButtonType } from "widgets/ButtonWidget/component";
import ButtonComponent from "widgets/ButtonWidget/component";
import type { ButtonWidgetProps } from "widgets/ButtonWidget/widget";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import IconSVG from "../icon.svg";

class FormButtonWidget extends ButtonWidget {
  constructor(props: FormButtonWidgetProps) {
    super(props);
  }

  static type = "FORM_BUTTON_WIDGET";

  static getConfig() {
    return {
      name: "FormButton",
      iconSVG: IconSVG,
      hideCard: true,
      isDeprecated: true,
      replacement: "BUTTON_WIDGET",
      needsMeta: true,
      tags: [WIDGET_TAGS.BUTTONS],
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any; // TODO (Sangeeth): Type error
  }

  static getDefaults() {
    return {
      rows: 4,
      columns: 12,
      widgetName: "FormButton",
      text: "Submit",
      isDefaultClickDisabled: true,
      recaptchaType: RecaptchaTypes.V3,
      version: 1,
      animateLoading: true,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any; // TODO (Sangeeth): Type error
  }

  static getMethods() {
    return {
      getSnipingModeUpdates: (
        propValueMap: SnipingModeProperty,
      ): PropertyUpdates[] => {
        return [
          {
            propertyPath: "onClick",
            propertyValue: propValueMap.run,
            isDynamicPropertyPath: true,
          },
        ];
      },
      getEditorCallouts(): WidgetCallout[] {
        return [
          {
            message: buildDeprecationWidgetMessage(
              FormButtonWidget.getConfig().name,
            ),
          },
        ];
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Form button is provided by default to every form. It is used for form submission and resetting form inputs",
      "!url": "https://docs.appsmith.com/widget-reference/form",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      text: "string",
      isDisabled: "bool",
      recaptchaToken: "string",
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
            label: "Animate loading",
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
            label: "Google reCAPTCHA version",
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
      },
      {
        sectionName: "Form options",
        children: [
          {
            helpText:
              "Disabled if the form is invalid, if this widget exists directly within a Form widget.",
            propertyName: "disabledWhenInvalid",
            label: "Disabled invalid forms",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText:
              "Resets the fields of the form, on click, if this widget exists directly within a Form widget.",
            propertyName: "resetFormOnClick",
            label: "Reset form on success",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "when the button is clicked",
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
            propertyName: "buttonColor",
            helpText: "Changes the color of the button",
            label: "Button color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "buttonVariant",
            label: "Button variant",
            controlType: "DROP_DOWN",
            helpText: "Sets the variant of the icon button",
            options: [
              {
                label: "Primary",
                value: ButtonVariantTypes.PRIMARY,
              },
              {
                label: "Secondary",
                value: ButtonVariantTypes.SECONDARY,
              },
              {
                label: "Tertiary",
                value: ButtonVariantTypes.TERTIARY,
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  ButtonVariantTypes.PRIMARY,
                  ButtonVariantTypes.SECONDARY,
                  ButtonVariantTypes.TERTIARY,
                ],
                default: ButtonVariantTypes.PRIMARY,
              },
            },
          },
          {
            propertyName: "borderRadius",
            label: "Border radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            isBindProperty: true,
            isJSConvertible: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
            },
          },
          {
            propertyName: "boxShadow",
            label: "Box shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
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
            dependencies: ["iconAlign"],
            validation: {
              type: ValidationTypes.TEXT,
            },
          },
          {
            propertyName: "placement",
            label: "Placement",
            controlType: "DROP_DOWN",
            helpText: "Sets the space between items",
            options: [
              {
                label: "Start",
                value: ButtonPlacementTypes.START,
              },
              {
                label: "Between",
                value: ButtonPlacementTypes.BETWEEN,
              },
              {
                label: "Center",
                value: ButtonPlacementTypes.CENTER,
              },
            ],
            defaultValue: ButtonPlacementTypes.CENTER,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  ButtonPlacementTypes.START,
                  ButtonPlacementTypes.BETWEEN,
                  ButtonPlacementTypes.CENTER,
                ],
                default: ButtonPlacementTypes.CENTER,
              },
            },
          },
          {
            propertyName: "iconAlign",
            label: "Icon Alignment",
            helpText: "Sets the icon alignment of the button",
            controlType: "ICON_TABS",
            defaultValue: "left",
            options: [
              {
                startIcon: "align-left",
                value: "left",
              },
              {
                startIcon: "align-right",
                value: "right",
              },
            ],
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

  static getStylesheetConfig(): Stylesheet {
    return {
      buttonColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
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

  getWidgetView() {
    const disabled =
      this.props.disabledWhenInvalid &&
      "isFormValid" in this.props &&
      !this.props.isFormValid;

    return (
      <ButtonComponent
        {...super.getWidgetView().props}
        isDisabled={disabled}
        onClick={!disabled ? this.onButtonClickBound : undefined}
      />
    );
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
  boxShadow?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
}

export interface FormButtonWidgetState extends WidgetState {
  isLoading: boolean;
}

export default FormButtonWidget;
