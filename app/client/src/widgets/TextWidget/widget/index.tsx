import type { ReactNode } from "react";
import React from "react";

import type { TextSize } from "constants/WidgetConstants";
import { countOccurrences } from "workers/Evaluation/helpers";

import { ValidationTypes } from "constants/WidgetValidation";
import type { DerivedPropertiesMap } from "utils/WidgetFactory";

import WidgetStyleContainer from "components/designSystems/appsmith/WidgetStyleContainer";
import type { Color } from "constants/Colors";
import type { Stylesheet } from "entities/AppTheming";
import { pick } from "lodash";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import type { ContainerStyle } from "widgets/ContainerWidget/component";
import type { TextAlign } from "../component";
import TextComponent from "../component";
import { OverflowTypes } from "../constants";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type { AutocompletionDefinitions } from "widgets/constants";

const MAX_HTML_PARSING_LENGTH = 1000;
class TextWidget extends BaseWidget<TextWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
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
            label: "Overflow Text",
            helpText: "Controls the text behavior when length of text exceeds",
            controlType: "ICON_TABS",
            fullWidth: true,
            options: [
              {
                label: "Scroll",
                value: OverflowTypes.SCROLL,
              },
              {
                label: "Truncate",
                value: OverflowTypes.TRUNCATE,
              },
              {
                label: "None",
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
    ];
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
      fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    };
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "fontFamily",
            label: "Font Family",
            helpText: "Controls the font family being used",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "System Default",
                value: "System Default",
              },
              {
                label: "Nunito Sans",
                value: "Nunito Sans",
              },
              {
                label: "Poppins",
                value: "Poppins",
              },
              {
                label: "Inter",
                value: "Inter",
              },
              {
                label: "Montserrat",
                value: "Montserrat",
              },
              {
                label: "Noto Sans",
                value: "Noto Sans",
              },
              {
                label: "Open Sans",
                value: "Open Sans",
              },
              {
                label: "Roboto",
                value: "Roboto",
              },
              {
                label: "Rubik",
                value: "Rubik",
              },
              {
                label: "Ubuntu",
                value: "Ubuntu",
              },
            ],
            defaultValue: "System Default",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
            },
          },
          {
            propertyName: "fontSize",
            label: "Font Size",
            helpText: "Controls the size of the font used",
            controlType: "DROP_DOWN",
            defaultValue: "1rem",
            options: [
              {
                label: "S",
                value: "0.875rem",
                subText: "0.875rem",
              },
              {
                label: "M",
                value: "1rem",
                subText: "1rem",
              },
              {
                label: "L",
                value: "1.25rem",
                subText: "1.25rem",
              },
              {
                label: "XL",
                value: "1.875rem",
                subText: "1.875rem",
              },
              {
                label: "XXL",
                value: "3rem",
                subText: "3rem",
              },
              {
                label: "3XL",
                value: "3.75rem",
                subText: "3.75rem",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
            },
          },
        ],
      },
      {
        sectionName: "Color",
        children: [
          {
            propertyName: "textColor",
            label: "Text Color",
            helpText: "Controls the color of the text displayed",
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
            propertyName: "backgroundColor",
            label: "Background Color",
            helpText: "Background color of the text added",
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
            propertyName: "truncateButtonColor",
            label: "Truncate Button Color",
            helpText: "Controls the color of the truncate button",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^((?![<|{{]).+){0,1}/,
              },
            },
            dependencies: ["overflow"],
            hidden: (props: TextWidgetProps) => {
              return props.overflow !== OverflowTypes.TRUNCATE;
            },
          },
        ],
      },
      {
        sectionName: "Text Formatting",
        children: [
          {
            propertyName: "textAlign",
            label: "Alignment",
            helpText: "Controls the horizontal alignment of the text",
            controlType: "ICON_TABS",
            fullWidth: true,
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
          {
            propertyName: "fontStyle",
            label: "Emphasis",
            helpText: "Controls the font emphasis of the text displayed",
            controlType: "BUTTON_GROUP",
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
        ],
      },
      {
        sectionName: "Border and Shadow",
        children: [
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
        ],
      },
    ];
  }

  /**
   * Disable html parsing for long continuous texts
   * @returns boolean
   */
  shouldDisableLink = (): boolean => {
    const text = this.props.text || "";
    const count: number = countOccurrences(text, "\n", false, 0);
    return (
      (count === 0 && text.length > MAX_HTML_PARSING_LENGTH) ||
      text.length > 50000
    );
  };

  getPageView() {
    const disableLink: boolean = this.props.disableLink
      ? true
      : this.shouldDisableLink();
    return (
      <WidgetStyleContainer
        className="t--text-widget-container"
        {...pick(this.props, [
          "widgetId",
          "containerStyle",
          "borderColor",
          "borderWidth",
        ])}
      >
        <TextComponent
          accentColor={this.props.accentColor}
          backgroundColor={this.props.backgroundColor}
          bottomRow={this.props.bottomRow}
          disableLink={disableLink}
          fontFamily={this.props.fontFamily}
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
          truncateButtonColor={
            this.props.truncateButtonColor || this.props.accentColor
          }
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

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "‌Text widget is used to display textual information. Whether you want to display a paragraph or information or add a heading to a container, a text widget makes it easy to style and display text",
      "!url": "https://docs.appsmith.com/widget-reference/text",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      text: "string",
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
  fontFamily: string;
}

export interface TextWidgetProps extends WidgetProps, TextStyles {
  accentColor: string;
  text?: string;
  isLoading: boolean;
  disableLink: boolean;
  widgetId: string;
  containerStyle?: ContainerStyle;
  children?: ReactNode;
  borderColor?: Color;
  borderWidth?: number;
  overflow: OverflowTypes;
}

export default TextWidget;
