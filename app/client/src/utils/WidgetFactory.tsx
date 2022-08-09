import {
  WidgetBuilder,
  WidgetDataProps,
  WidgetProps,
  WidgetState,
} from "widgets/BaseWidget";
import React from "react";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";

import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import { RenderMode } from "constants/WidgetConstants";
import * as log from "loglevel";
import { WidgetFeatures } from "./WidgetFeatures";
import {
  addPropertyConfigIds,
  convertFunctionsToString,
  enhancePropertyPaneConfig,
} from "./WidgetFactoryHelpers";

type WidgetDerivedPropertyType = any;
export type DerivedPropertiesMap = Record<string, string>;
export type WidgetType = typeof WidgetFactory.widgetTypes[number];

class WidgetFactory {
  static widgetTypes: Record<string, string> = {};
  static widgetMap: Map<
    WidgetType,
    WidgetBuilder<WidgetProps, WidgetState>
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
  static propertyPaneContentConfigsMap: Map<
    WidgetType,
    readonly PropertyPaneConfig[]
  > = new Map();
  static propertyPaneStyleConfigsMap: Map<
    WidgetType,
    readonly PropertyPaneConfig[]
  > = new Map();

  static widgetConfigMap: Map<
    WidgetType,
    Partial<WidgetProps> & WidgetConfigProps & { type: string }
  > = new Map();

  static registerWidgetBuilder(
    widgetType: string,
    widgetBuilder: WidgetBuilder<WidgetProps, WidgetState>,
    derivedPropertiesMap: DerivedPropertiesMap,
    defaultPropertiesMap: Record<string, string>,
    metaPropertiesMap: Record<string, any>,
    propertyPaneConfig?: PropertyPaneConfig[],
    propertyPaneContentConfig?: PropertyPaneConfig[],
    propertyPaneStyleConfig?: PropertyPaneConfig[],
    features?: WidgetFeatures,
  ) {
    if (!this.widgetTypes[widgetType]) {
      this.widgetTypes[widgetType] = widgetType;
      this.widgetMap.set(widgetType, widgetBuilder);
      this.derivedPropertiesMap.set(widgetType, derivedPropertiesMap);
      this.defaultPropertiesMap.set(widgetType, defaultPropertiesMap);
      this.metaPropertiesMap.set(widgetType, metaPropertiesMap);

      if (propertyPaneConfig) {
        const enhancedPropertyPaneConfig = enhancePropertyPaneConfig(
          propertyPaneConfig,
          features,
        );

        const serializablePropertyPaneConfig = convertFunctionsToString(
          enhancedPropertyPaneConfig,
        );

        const finalPropertyPaneConfig = addPropertyConfigIds(
          serializablePropertyPaneConfig,
        );

        this.propertyPaneConfigsMap.set(
          widgetType,
          Object.freeze(finalPropertyPaneConfig),
        );
      }

      if (propertyPaneContentConfig) {
        const enhancedPropertyPaneConfig = enhancePropertyPaneConfig(
          propertyPaneContentConfig,
          features,
        );

        const serializablePropertyPaneConfig = convertFunctionsToString(
          enhancedPropertyPaneConfig,
        );

        const finalPropertyPaneConfig = addPropertyConfigIds(
          serializablePropertyPaneConfig,
        );

        this.propertyPaneContentConfigsMap.set(
          widgetType,
          Object.freeze(finalPropertyPaneConfig),
        );
      }

      if (propertyPaneStyleConfig) {
        const enhancedPropertyPaneConfig = enhancePropertyPaneConfig(
          propertyPaneStyleConfig,
          features,
        );

        const serializablePropertyPaneConfig = convertFunctionsToString(
          enhancedPropertyPaneConfig,
        );

        const finalPropertyPaneConfig = addPropertyConfigIds(
          serializablePropertyPaneConfig,
        );

        this.propertyPaneStyleConfigsMap.set(
          widgetType,
          Object.freeze(finalPropertyPaneConfig),
        );
      }
    }
  }

  static storeWidgetConfig(
    widgetType: string,
    config: Partial<WidgetProps> & WidgetConfigProps & { type: string },
  ) {
    this.widgetConfigMap.set(widgetType, Object.freeze(config));
  }

  static createWidget(
    widgetData: WidgetDataProps,
    renderMode: RenderMode,
  ): React.ReactNode {
    const widgetProps: WidgetProps = {
      key: widgetData.widgetId,
      isVisible: true,
      ...widgetData,
      renderMode,
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
      log.error(ex);
      return null;
    }
  }

  static getWidgetTypes(): WidgetType[] {
    return Array.from(this.widgetMap.keys());
  }

  static getWidgetDerivedPropertiesMap(
    widgetType: WidgetType,
  ): DerivedPropertiesMap {
    const map = this.derivedPropertiesMap.get(widgetType);
    if (!map) {
      log.error("Widget type validation is not defined");
      return {};
    }
    return map;
  }

  static getWidgetDefaultPropertiesMap(
    widgetType: WidgetType,
  ): Record<string, string> {
    const map = this.defaultPropertiesMap.get(widgetType);
    if (!map) {
      log.error("Widget default properties not defined", widgetType);
      return {};
    }
    return map;
  }

  static getWidgetMetaPropertiesMap(
    widgetType: WidgetType,
  ): Record<string, unknown> {
    const map = this.metaPropertiesMap.get(widgetType);
    if (!map) {
      log.error("Widget meta properties not defined: ", widgetType);
      return {};
    }
    return map;
  }

  static getWidgetPropertyPaneConfig(
    type: WidgetType,
  ): readonly PropertyPaneConfig[] {
    const map = this.propertyPaneConfigsMap.get(type);
    if (!map) {
      log.error("Widget property pane configs not defined", type);
      return [];
    }
    return map;
  }

  static getWidgetPropertyPaneContentConfig(
    type: WidgetType,
  ): readonly PropertyPaneConfig[] {
    const map = this.propertyPaneContentConfigsMap.get(type);
    if (!map) {
      return [];
    }
    return map;
  }

  static getWidgetPropertyPaneStyleConfig(
    type: WidgetType,
  ): readonly PropertyPaneConfig[] {
    const map = this.propertyPaneStyleConfigsMap.get(type);
    if (!map) {
      return [];
    }
    return map;
  }

  static getWidgetTypeConfigMap(): WidgetTypeConfigMap {
    const typeConfigMap: WidgetTypeConfigMap = {};
    WidgetFactory.getWidgetTypes().forEach((type) => {
      typeConfigMap[type] = {
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
    defaultProperties: Record<string, string>;
    metaProperties: Record<string, any>;
    derivedProperties: WidgetDerivedPropertyType;
  }
>;

export interface WidgetCreationException {
  message: string;
}

export default WidgetFactory;
