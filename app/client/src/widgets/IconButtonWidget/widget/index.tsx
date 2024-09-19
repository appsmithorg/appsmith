import type { IconName } from "@blueprintjs/icons";
import React from "react";

import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";

import { IconNames } from "@blueprintjs/icons";
import type { ButtonVariant } from "components/constants";
import { ButtonVariantTypes } from "components/constants";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import IconButtonComponent from "../component";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { ICON_BUTTON_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";

import { WIDGET_TAGS } from "constants/WidgetConstants";

const ICON_BUTTON_SIZE_IN_AUTOLAYOUT = 32;

const ICON_NAMES = Object.keys(IconNames).map(
  (name: string) => IconNames[name as keyof typeof IconNames],
);

export interface IconButtonWidgetProps extends WidgetProps {
  iconName?: IconName;
  backgroundColor: string;
  buttonVariant: ButtonVariant;
  borderRadius: string;
  boxShadow: string;
  boxShadowColor: string;
  isDisabled: boolean;
  isVisible: boolean;
  onClick?: string;
}

class IconButtonWidget extends BaseWidget<IconButtonWidgetProps, WidgetState> {
  static type = "ICON_BUTTON_WIDGET";

  static getConfig() {
    return {
      name: "Icon button",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.BUTTONS],
      searchTags: ["click", "submit"],
    };
  }

  static getDefaults() {
    return {
      iconName: IconNames.PLUS,
      buttonVariant: ButtonVariantTypes.PRIMARY,
      isDisabled: false,
      isVisible: true,
      rows: 4,
      columns: 4,
      widgetName: "IconButton",
      version: 1,
      animateLoading: true,
      responsiveBehavior: ResponsiveBehavior.Hug,
      minWidth: ICON_BUTTON_MIN_WIDTH,
    };
  }

  static getAutoLayoutConfig() {
    return {
      defaults: {
        rows: 4,
        columns: 2.21,
      },
      autoDimension: {
        width: true,
      },
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "40px",
              minHeight: "40px",
            };
          },
        },
      ],
      disableResizeHandles: {
        horizontal: true,
        vertical: true,
      },
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "40px" },
        minWidth: { base: "40px" },
      },
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Basic",
        children: [
          {
            propertyName: "iconName",
            label: "Icon",
            helpText: "Sets the icon to be used for the icon button",
            controlType: "ICON_SELECT",
            defaultIconName: "plus",
            hideNoneIcon: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ICON_NAMES,
                default: IconNames.PLUS,
              },
            },
          },
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
        sectionName: "General",
        children: [
          {
            helpText: "Show helper text with button on hover",
            propertyName: "tooltip",
            label: "Tooltip",
            controlType: "INPUT_TEXT",
            placeholderText: "Add Input Field",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
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
            propertyName: "isDisabled",
            helpText: "Disables input to the widget",
            label: "Disabled",
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
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "buttonVariant",
            label: "Button variant",
            controlType: "ICON_TABS",
            defaultValue: ButtonVariantTypes.PRIMARY,
            fullWidth: true,
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
        ],
      },
      {
        sectionName: "Color",
        children: [
          {
            propertyName: "buttonColor",
            helpText: "Sets the style of the icon button",
            label: "Button color",
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
        ],
      },
      {
        sectionName: "Border and shadow",
        children: [
          {
            propertyName: "borderRadius",
            label: "Border radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
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

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setDisabled: {
          path: "isDisabled",
          type: "boolean",
        },
      },
    };
  }

  getWidgetView() {
    const {
      borderRadius,
      boxShadow,
      buttonColor,
      buttonVariant,
      iconName,
      isDisabled,
      isVisible,
      tooltip,
      widgetId,
    } = this.props;
    const { componentHeight, componentWidth } = this.props;

    return (
      <IconButtonComponent
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        buttonColor={buttonColor}
        buttonVariant={buttonVariant}
        hasOnClickAction={!!this.props.onClick}
        height={
          this.isAutoLayoutMode
            ? ICON_BUTTON_SIZE_IN_AUTOLAYOUT
            : componentHeight
        }
        iconName={iconName}
        isDisabled={isDisabled}
        isVisible={isVisible}
        minHeight={this.props.minHeight}
        minWidth={this.props.minWidth}
        onClick={this.handleClick}
        renderMode={this.props.renderMode}
        tooltip={tooltip}
        widgetId={widgetId}
        width={
          this.isAutoLayoutMode
            ? ICON_BUTTON_SIZE_IN_AUTOLAYOUT
            : componentWidth
        }
      />
    );
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Icon button widget is just an icon, along with all other button properties.",
      "!url": "https://docs.appsmith.com/widget-reference/icon-button",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
    };
  }

  handleClick = () => {
    const { onClick } = this.props;

    if (onClick) {
      super.executeAction({
        triggerPropertyName: "onClick",
        dynamicString: onClick,
        event: {
          type: EventType.ON_CLICK,
        },
      });
    }
  };
}

export default IconButtonWidget;
