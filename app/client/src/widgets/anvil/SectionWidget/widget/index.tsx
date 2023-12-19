import type {
  AnvilConfig,
  AutocompletionDefinitions,
  WidgetBaseConfiguration,
  WidgetDefaultProps,
} from "WidgetProvider/constants";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import { anvilConfig, baseConfig, defaultConfig } from "./config";
import { ValidationTypes } from "constants/WidgetValidation";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import type {
  LayoutComponentProps,
  LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import BaseWidget from "widgets/BaseWidget";
import type { ReactNode } from "react";
import { renderLayouts } from "layoutSystems/anvil/utils/layouts/renderUtils";
import { RenderModes } from "constants/WidgetConstants";
import React from "react";
import ContainerComponent from "widgets/anvil/Container";

class SectionWidget extends BaseWidget<SectionWidgetProps, WidgetState> {
  static type = "SECTION_WIDGET";

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
          {
            propertyName: "zoneCount",
            label: "Zones",
            controlType: "ZONE_STEPPER",
            helpText: "Changes the no. of zones in a section",
            isBindProperty: true,
            isJSConvertible: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
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
            propertyName: "elevatedBackground",
            label: "Background",
            controlType: "SWITCH",
            fullWidth: true,
            helpText: "Sets the semantic elevated background of the zone",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
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
      <ContainerComponent
        {...this.props}
        elevatedBackground={this.props.elevatedBackground}
        elevation="1"
        noScroll
      >
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

export interface SectionWidgetProps extends ContainerWidgetProps<WidgetProps> {
  layout: LayoutProps[];
}

export default SectionWidget;
