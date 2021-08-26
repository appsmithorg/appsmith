import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import ButtonGroupComponent from "components/designSystems/blueprint/ButtonGroupComponent";
import { ValidationTypes } from "constants/WidgetValidation";
import * as Sentry from "@sentry/react";
import { ButtonBorderRadiusTypes } from "components/propertyControls/BorderRadiusOptionsControl";

class ButtonGroupWidget extends BaseWidget<
  ButtonGroupWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
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
        ],
      },
      {
        sectionName: "Styles",
        children: [
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
        ],
      },
    ];
  }

  getPageView() {
    return (
      <ButtonGroupComponent
        isHorizontal={false}
        widgetId={this.props.widgetId}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "BUTTON_GROUP_WIDGET";
  }
}

export interface ButtonGroupWidgetProps extends WidgetProps {
  orientation: string;
  capType: string;
  capSide?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  dividerColor?: string;
  thickness?: number;
}

export default ButtonGroupWidget;
export const ProfiledButtonGroupWidget = Sentry.withProfiler(ButtonGroupWidget);
