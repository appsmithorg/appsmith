import React from "react";
import { pick } from "lodash";
import WidgetStyleContainer, {
  WidgetStyleContainerProps,
} from "components/designSystems/appsmith/WidgetStyleContainer";

import { TextSize } from "constants/WidgetConstants";

import { ValidationTypes } from "constants/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import TextComponent, { TextAlign } from "../component";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { OverflowTypes } from "../constants";

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
            placeholderText: "Name:",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: { limitLineBreaks: true },
            },
          },
          {
            propertyName: "overflow",
            label: "Overflow",
            helpText: "Controls the text behavior when length of text exceeds",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Scroll contents",
                value: OverflowTypes.SCROLL,
              },
              {
                label: "Truncate text",
                value: OverflowTypes.TRUNCATE,
              },
              {
                label: "No overflow",
                value: OverflowTypes.NONE,
              },
            ],
            defaultValue: OverflowTypes.NONE,
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
            propertyName: "disableLink",
            helpText: "Controls parsing text as Link",
            label: "Disable Link",
            controlType: "SWITCH",
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
            propertyName: "backgroundColor",
            label: "Cell Background Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^((?![<|{{]).+){0,1}/,
                expected: {
                  type: "string (HTML color name or HEX value)",
                  example: `red | #9C0D38`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
          },
          {
            propertyName: "textColor",
            label: "Text Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
          },
          {
            propertyName: "truncateButtonColor",
            label: "Truncate Button Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
            dependencies: ["overflow"],
            hidden: (props: TextWidgetProps) => {
              return props.overflow !== OverflowTypes.TRUNCATE;
            },
          },
          {
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            propertyName: "borderColor",
            label: "Border Color",
            controlType: "COLOR_PICKER",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText:
              "Enter value for border width which can also use as margin",
            propertyName: "borderWidth",
            label: "Border Width",
            placeholderText: "Enter value in px",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
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
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  "HEADING1",
                  "HEADING2",
                  "HEADING3",
                  "PARAGRAPH",
                  "PARAGRAPH2",
                ],
              },
            },
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
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
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
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  getPageView() {
    return (
      <WidgetStyleContainer
        {...pick(this.props, [
          "widgetId",
          "containerStyle",
          "borderColor",
          "borderWidth",
        ])}
      >
        <TextComponent
          backgroundColor={this.props.backgroundColor}
          bottomRow={this.props.bottomRow}
          disableLink={this.props.disableLink || false}
          fontSize={this.props.fontSize}
          fontStyle={this.props.fontStyle}
          isLoading={this.props.isLoading}
          key={this.props.widgetId}
          leftColumn={this.props.leftColumn}
          overflow={this.props.overflow}
          rightColumn={this.props.rightColumn}
          text={this.props.text}
          textAlign={this.props.textAlign ? this.props.textAlign : "LEFT"}
          textColor={this.props.textColor}
          topRow={this.props.topRow}
          truncateButtonColor={this.props.truncateButtonColor}
          widgetId={this.props.widgetId}
        />
      </WidgetStyleContainer>
    );
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{ this.text }}`,
    };
  }

  static getWidgetType() {
    return "TEXT_WIDGET";
  }
}

export interface TextStyles {
  backgroundColor?: string;
  textColor?: string;
  fontStyle?: string;
  fontSize?: TextSize;
  textAlign?: TextAlign;
  truncateButtonColor?: string;
}

export interface TextWidgetProps
  extends WidgetProps,
    TextStyles,
    WidgetStyleContainerProps {
  text?: string;
  isLoading: boolean;
  disableLink: boolean;
  overflow: OverflowTypes;
}

export default TextWidget;
