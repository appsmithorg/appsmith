import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import TextComponent from "components/designSystems/blueprint/TextComponent";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import * as Sentry from "@sentry/react";

const LINE_HEIGHTS: { [key in TextStyle]: number } = {
  // The following values are arrived at by multiplying line-height with font-size
  BODY: 1.5 * 14,
  HEADING: 1.28581 * 16,
  LABEL: 1.28581 * 14,
};

class TextWidget extends BaseWidget<TextWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "text",
            helpText: "Sets the text of the widget",
            label: "Text",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter text",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "shouldScroll",
            label: "Enable Scroll",
            helpText: "Allows scrolling text instead of truncation",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "isVisible",
            helpText: "Controls the visibility of the widget",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Styles",
        children: [
          {
            propertyName: "backgroundColor",
            label: "Cell Background",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "textColor",
            label: "Text Color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "textStyle",
            helpText: "Sets the font and style of the text",
            label: "Text Style",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Heading",
                value: "HEADING",
              },
              {
                label: "Label",
                value: "LABEL",
              },
              {
                label: "Body",
                value: "BODY",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "fontStyle",
            label: "Font Style",
            controlType: "BUTTON_TABS",
            options: [
              {
                icon: "BOLD_FONT",
                value: "BOLD",
              },
              {
                icon: "ITALICS_FONT",
                value: "ITALIC",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "textAlign",
            label: "Text Align",
            controlType: "ICON_TABS",
            options: [
              {
                icon: "LEFT_ALIGN",
                value: "LEFT",
              },
              {
                icon: "CENTER_ALIGN",
                value: "CENTER",
              },
              {
                icon: "RIGHT_ALIGN",
                value: "RIGHT",
              },
            ],
            defaultValue: "LEFT",
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
    ];
  }
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      text: VALIDATION_TYPES.TEXT,
      textStyle: VALIDATION_TYPES.TEXT,
      shouldScroll: VALIDATION_TYPES.BOOLEAN,
    };
  }

  getNumberOfLines() {
    const height = (this.props.bottomRow - this.props.topRow) * 40;
    const lineHeight = LINE_HEIGHTS[this.props.textStyle];
    return Math.floor(height / lineHeight);
  }

  getPageView() {
    // const lines = this.getNumberOfLines();
    return (
      <TextComponent
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        textStyle={this.props.textStyle}
        text={this.props.text}
        fontStyle={this.props.fontStyle}
        textColor={this.props.textColor}
        backgroundColor={this.props.backgroundColor}
        textAlign={this.props.textAlign ? this.props.textAlign : "LEFT"}
        isLoading={this.props.isLoading}
        shouldScroll={this.props.shouldScroll}
        // lines={lines}
      />
    );
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{ this.text }}`,
    };
  }

  getWidgetType(): WidgetType {
    return "TEXT_WIDGET";
  }
}

export type TextStyle = "BODY" | "HEADING" | "LABEL";
export type TextAlign = "LEFT" | "CENTER" | "RIGHT" | "JUSTIFY";

export interface TextStyles {
  backgroundColor?: string;
  textColor?: string;
  fontStyle?: string;
  textStyle: TextStyle;
  textAlign?: TextAlign;
}

export interface TextWidgetProps extends WidgetProps, TextStyles {
  text?: string;
  isLoading: boolean;
  shouldScroll: boolean;
}

export default TextWidget;
export const ProfiledTextWidget = Sentry.withProfiler(TextWidget);
