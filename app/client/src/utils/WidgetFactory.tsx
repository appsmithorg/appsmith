import { WidgetType, RenderMode } from "constants/WidgetConstants";
import {
  WidgetBuilder,
  WidgetProps,
  WidgetDataProps,
  WidgetState,
} from "widgets/BaseWidget";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "./WidgetValidation";
import React from "react";
import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
} from "constants/PropertyControlConstants";
import { generateReactKey } from "./generators";

type WidgetDerivedPropertyType = any;
export type DerivedPropertiesMap = Record<string, string>;

// TODO (abhinav): To enforce the property pane config structure in this function
// Throw an error if the config is not of the desired format.
const addPropertyConfigIds = (config: PropertyPaneConfig[]) => {
  return config.map((sectionOrControlConfig: PropertyPaneConfig) => {
    sectionOrControlConfig.id = generateReactKey();
    if (sectionOrControlConfig.children) {
      sectionOrControlConfig.children = addPropertyConfigIds(
        sectionOrControlConfig.children,
      );
    }
    const config = sectionOrControlConfig as PropertyPaneControlConfig;
    if (
      config.panelConfig &&
      config.panelConfig.children &&
      Array.isArray(config.panelConfig.children)
    ) {
      config.panelConfig.children = addPropertyConfigIds(
        config.panelConfig.children,
      );

      (sectionOrControlConfig as PropertyPaneControlConfig) = config;
    }
    return sectionOrControlConfig;
  });
};
class WidgetFactory {
  static widgetMap: Map<
    WidgetType,
    WidgetBuilder<WidgetProps, WidgetState>
  > = new Map();
  static widgetPropValidationMap: Map<
    WidgetType,
    WidgetPropertyValidationType
  > = new Map();
  static widgetDerivedPropertiesGetterMap: Map<
    WidgetType,
    WidgetDerivedPropertyType
  > = new Map();
  static derivedPropertiesMap: Map<
    WidgetType,
    DerivedPropertiesMap
  > = new Map();
  static defaultPropertiesMap: Map<
    WidgetType,
    Record<string, string>
  > = new Map();
  static metaPropertiesMap: Map<WidgetType, Record<string, any>> = new Map();
  static propertyPaneConfigsMap: Map<
    WidgetType,
    readonly PropertyPaneConfig[]
  > = new Map();

  static registerWidgetBuilder(
    widgetType: WidgetType,
    widgetBuilder: WidgetBuilder<WidgetProps, WidgetState>,
    widgetPropertyValidation: WidgetPropertyValidationType,
    derivedPropertiesMap: DerivedPropertiesMap,
    defaultPropertiesMap: Record<string, string>,
    metaPropertiesMap: Record<string, any>,
    propertyPaneConfig?: PropertyPaneConfig[],
  ) {
    this.widgetMap.set(widgetType, widgetBuilder);
    this.widgetPropValidationMap.set(widgetType, widgetPropertyValidation);
    this.derivedPropertiesMap.set(widgetType, derivedPropertiesMap);
    this.defaultPropertiesMap.set(widgetType, defaultPropertiesMap);
    this.metaPropertiesMap.set(widgetType, metaPropertiesMap);

    propertyPaneConfig &&
      this.propertyPaneConfigsMap.set(
        widgetType,
        Object.freeze(addPropertyConfigIds(propertyPaneConfig)),
      );
  }

  static createWidget(
    widgetData: WidgetDataProps,
    renderMode: RenderMode,
  ): React.ReactNode {
    const widgetProps: WidgetProps = {
      key: widgetData.widgetId,
      isVisible: true,
      ...widgetData,
      renderMode: renderMode,
    };
    const widgetBuilder = this.widgetMap.get(widgetData.type);
    if (widgetBuilder) {
      // TODO validate props here
      const widget = widgetBuilder.buildWidget(widgetProps);
      return widget;
    } else {
      const ex: WidgetCreationException = {
        message:
          "Widget Builder not registered for widget type" + widgetData.type,
      };
      console.error(ex);
      return null;
    }
  }

  static getWidgetTypes(): WidgetType[] {
    return Array.from(this.widgetMap.keys());
  }

  static getWidgetPropertyValidationMap(
    widgetType: WidgetType,
  ): WidgetPropertyValidationType {
    const map = this.widgetPropValidationMap.get(widgetType);
    if (!map) {
      console.error("Widget type validation is not defined");
      return BASE_WIDGET_VALIDATION;
    }
    return map;
  }

  static getWidgetDerivedPropertiesMap(
    widgetType: WidgetType,
  ): DerivedPropertiesMap {
    const map = this.derivedPropertiesMap.get(widgetType);
    if (!map) {
      console.error("Widget type validation is not defined");
      return {};
    }
    return map;
  }

  static getWidgetDefaultPropertiesMap(
    widgetType: WidgetType,
  ): Record<string, string> {
    const map = this.defaultPropertiesMap.get(widgetType);
    if (!map) {
      console.error("Widget default properties not defined", widgetType);
      return {};
    }
    return map;
  }

  static getWidgetMetaPropertiesMap(
    widgetType: WidgetType,
  ): Record<string, any> {
    const map = this.metaPropertiesMap.get(widgetType);
    if (!map) {
      console.error("Widget meta properties not defined: ", widgetType);
      return {};
    }
    return map;
  }

  static getWidgetPropertyPaneConfig(
    type: WidgetType,
  ): readonly PropertyPaneConfig[] {
    const map = this.propertyPaneConfigsMap.get(type);
    if (!map) {
      console.error("Widget property pane configs not defined", type);
      return [];
    }
    return map;
  }

  static getWidgetTypeConfigMap(): WidgetTypeConfigMap {
    const typeConfigMap: WidgetTypeConfigMap = {};
    WidgetFactory.getWidgetTypes().forEach((type) => {
      typeConfigMap[type] = {
        validations: WidgetFactory.getWidgetPropertyValidationMap(type),
        defaultProperties: WidgetFactory.getWidgetDefaultPropertiesMap(type),
        derivedProperties: WidgetFactory.getWidgetDerivedPropertiesMap(type),
        metaProperties: WidgetFactory.getWidgetMetaPropertiesMap(type),
      };
    });
    return typeConfigMap;
  }
}

export type WidgetTypeConfigMap = Record<
  string,
  {
    validations: WidgetPropertyValidationType;
    derivedProperties: WidgetDerivedPropertyType;
    defaultProperties: Record<string, string>;
    metaProperties: Record<string, any>;
  }
>;

export interface WidgetCreationException {
  message: string;
}

export default WidgetFactory;
