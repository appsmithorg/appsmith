import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType, TextSize } from "constants/WidgetConstants";
import TextComponent from "components/designSystems/blueprint/TextComponent";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import * as Sentry from "@sentry/react";

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
            validation: VALIDATION_TYPES.TEXT,
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
            validation: VALIDATION_TYPES.BOOLEAN,
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
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.COLOR_PICKER_TEXT,
          },
          {
            propertyName: "fontSize",
            label: "Text Size",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Heading 1",
                value: "HEADING1",
                subText: "24px",
                icon: "HEADING_ONE",
              },
              {
                label: "Heading 2",
                value: "HEADING2",
                subText: "18px",
                icon: "HEADING_TWO",
              },
              {
                label: "Heading 3",
                value: "HEADING3",
                subText: "16px",
                icon: "HEADING_THREE",
              },
              {
                label: "Paragraph",
                value: "PARAGRAPH",
                subText: "14px",
                icon: "PARAGRAPH",
              },
              {
                label: "Paragraph 2",
                value: "PARAGRAPH2",
                subText: "12px",
                icon: "PARAGRAPH_TWO",
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
          {
            helpText: "Enter value for padding (px)",
            propertyName: "padding",
            label: "Padding",
            placeholderText: "Enter value for padding (px)",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.NUMBER,
          },
        ],
      },
    ];
  }

  getPageView() {
    return (
      <TextComponent
        backgroundColor={this.props.backgroundColor}
        fontSize={this.props.fontSize}
        fontStyle={this.props.fontStyle}
        isLoading={this.props.isLoading}
        key={this.props.widgetId}
        padding={this.props.padding}
        shouldScroll={this.props.shouldScroll}
        text={this.props.text}
        textAlign={this.props.textAlign ? this.props.textAlign : "LEFT"}
        textColor={this.props.textColor}
        widgetId={this.props.widgetId}
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

export type TextAlign = "LEFT" | "CENTER" | "RIGHT" | "JUSTIFY";

export interface TextStyles {
  backgroundColor?: string;
  textColor?: string;
  fontStyle?: string;
  fontSize?: TextSize;
  textAlign?: TextAlign;
  padding?: string;
}

export interface TextWidgetProps extends WidgetProps, TextStyles {
  text?: string;
  isLoading: boolean;
  shouldScroll: boolean;
}

export default TextWidget;
export const ProfiledTextWidget = Sentry.withProfiler(TextWidget);
