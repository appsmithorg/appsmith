import React, { type ReactNode } from "react";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
  WidgetBaseConfiguration,
  WidgetDefaultProps,
} from "WidgetProvider/constants";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { anvilConfig, baseConfig, defaultConfig } from "./config";
import { ValidationTypes } from "constants/WidgetValidation";
import BaseWidget, {
  type WidgetProps,
  type WidgetState,
} from "widgets/BaseWidget";
import type {
  LayoutComponentProps,
  LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { renderLayouts } from "layoutSystems/anvil/utils/layouts/renderUtils";
import { RenderModes } from "constants/WidgetConstants";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import ContainerComponent from "widgets/ContainerWidget/component";

class ZoneWidget extends BaseWidget<ZoneWidgetProps, WidgetState> {
  static type = "ZONE_WIDGET";

  static getConfig(): WidgetBaseConfiguration {
    return baseConfig;
  }

  static getDefaults(): WidgetDefaultProps {
    return defaultConfig;
  }

  static getPropertyPaneConfig() {
    return [];
  }
  static getPropertyPaneContentConfig() {
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
            defaultValue: true,
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
        sectionName: "Color",
        children: [
          {
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            propertyName: "backgroundColor",
            label: "Background color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            propertyName: "borderColor",
            label: "Border color",
            controlType: "COLOR_PICKER",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Border and shadow",
        children: [
          {
            helpText: "Enter value for border width",
            propertyName: "borderWidth",
            label: "Border width",
            placeholderText: "Enter value in px",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
            postUpdateAction: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
          },
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

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {};
  }

  static getSetterConfig(): SetterConfig | null {
    return null;
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getAnvilConfig(): AnvilConfig | null {
    return anvilConfig;
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    };
  }

  getWidgetView(): ReactNode {
    const map: LayoutComponentProps["childrenMap"] = {};
    (this.props.children ?? []).forEach((child: WidgetProps) => {
      map[child.widgetId] = child;
    });
    return (
      <ContainerComponent {...this.props} noScroll>
        {renderLayouts(
          this.props.layout,
          map,
          this.props.widgetId,
          "",
          this.props.renderMode || RenderModes.CANVAS,
          [],
        )}
      </ContainerComponent>
    );
  }
}

export interface ZoneWidgetProps extends ContainerWidgetProps<WidgetProps> {
  layout: LayoutProps[];
}

export default ZoneWidget;
