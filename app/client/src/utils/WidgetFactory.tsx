import { WidgetBuilder, WidgetProps, WidgetState } from "widgets/BaseWidget";
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
  generatePropertyPaneSearchConfig,
  addSearchConfigToPanelConfig,
  PropertyPaneConfigTypes,
} from "./WidgetFactoryHelpers";
import { CanvasWidgetStructure } from "widgets/constants";
import { Stylesheet } from "entities/AppTheming";

type WidgetDerivedPropertyType = any;
export type DerivedPropertiesMap = Record<string, string>;
export type WidgetType = typeof WidgetFactory.widgetTypes[number];

export enum NonSerialisableWidgetConfigs {
  CANVAS_HEIGHT_OFFSET = "canvasHeightOffset",
}
class WidgetFactory {
  static widgetTypes: Record<string, string> = {};
  static widgetMap: Map<
    WidgetType,
    WidgetBuilder<CanvasWidgetStructure, WidgetState>
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
  // used to store the properties that appear in the search results
  static propertyPaneSearchConfigsMap: Map<
    WidgetType,
    readonly PropertyPaneConfig[]
  > = new Map();
  static loadingProperties: Map<WidgetType, Array<RegExp>> = new Map();
  static stylesheetConfigMap: Map<WidgetType, Stylesheet> = new Map();

  static widgetConfigMap: Map<
    WidgetType,
    Partial<WidgetProps> & WidgetConfigProps & { type: string }
  > = new Map();

  static nonSerialisableWidgetConfigMap: Map<
    WidgetType,
    Record<NonSerialisableWidgetConfigs, unknown>
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
    loadingProperties?: Array<RegExp>,
    stylesheetConfig?: Stylesheet,
  ) {
    if (!this.widgetTypes[widgetType]) {
      this.widgetTypes[widgetType] = widgetType;
      this.widgetMap.set(widgetType, widgetBuilder);
      this.derivedPropertiesMap.set(widgetType, derivedPropertiesMap);
      this.defaultPropertiesMap.set(
        widgetType,
        defaultPropertiesMap as Record<string, string>,
      );
      this.metaPropertiesMap.set(widgetType, metaPropertiesMap);
      loadingProperties &&
        this.loadingProperties.set(widgetType, loadingProperties);
      stylesheetConfig &&
        this.stylesheetConfigMap.set(widgetType, stylesheetConfig);

      if (Array.isArray(propertyPaneConfig) && propertyPaneConfig.length > 0) {
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
          PropertyPaneConfigTypes.CONTENT,
          widgetType,
        );

        const serializablePropertyPaneConfig = convertFunctionsToString(
          enhancedPropertyPaneConfig,
        );

        const propertyPaneConfigWithIds = addPropertyConfigIds(
          serializablePropertyPaneConfig,
        );

        const finalPropertyPaneConfig = addSearchConfigToPanelConfig(
          propertyPaneConfigWithIds,
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
          PropertyPaneConfigTypes.STYLE,
        );

        const serializablePropertyPaneConfig = convertFunctionsToString(
          enhancedPropertyPaneConfig,
        );

        const propertyPaneConfigWithIds = addPropertyConfigIds(
          serializablePropertyPaneConfig,
        );

        const finalPropertyPaneConfig = addSearchConfigToPanelConfig(
          propertyPaneConfigWithIds,
        );

        this.propertyPaneStyleConfigsMap.set(
          widgetType,
          Object.freeze(finalPropertyPaneConfig),
        );
      }

      this.propertyPaneSearchConfigsMap.set(
        widgetType,
        generatePropertyPaneSearchConfig(
          WidgetFactory.getWidgetPropertyPaneContentConfig(widgetType),
          WidgetFactory.getWidgetPropertyPaneStyleConfig(widgetType),
        ),
      );
    }
  }

  static storeWidgetConfig(
    widgetType: string,
    config: Partial<WidgetProps> & WidgetConfigProps & { type: string },
  ) {
    this.widgetConfigMap.set(widgetType, Object.freeze(config));
  }

  static storeNonSerialisablewidgetConfig(
    widgetType: string,
    config: Record<NonSerialisableWidgetConfigs, unknown>,
  ) {
    this.nonSerialisableWidgetConfigMap.set(widgetType, config);
  }

  static createWidget(
    widgetData: CanvasWidgetStructure,
    renderMode: RenderMode,
  ): React.ReactNode {
    const widgetProps = {
      key: widgetData.widgetId,
      isVisible: true,
      ...widgetData,
      renderMode,
    };
    const widgetBuilder = this.widgetMap.get(widgetData.type);
    if (widgetBuilder) {
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

  static getWidgetPropertyPaneCombinedConfig(
    type: WidgetType,
  ): readonly PropertyPaneConfig[] {
    const contentConfig = this.propertyPaneContentConfigsMap.get(type) || [];
    const styleConfig = this.propertyPaneStyleConfigsMap.get(type) || [];
    return [...contentConfig, ...styleConfig];
  }

  static getWidgetPropertyPaneConfig(
    type: WidgetType,
  ): readonly PropertyPaneConfig[] {
    const map = this.propertyPaneConfigsMap.get(type);
    if (!map || (map && map.length === 0)) {
      const config = WidgetFactory.getWidgetPropertyPaneCombinedConfig(type);
      if (config === undefined) {
        log.error("Widget property pane config not defined", type);
      }
      return config;
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

  static getWidgetPropertyPaneSearchConfig(
    type: WidgetType,
  ): readonly PropertyPaneConfig[] {
    const map = this.propertyPaneSearchConfigsMap.get(type);
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

  static getLoadingProperties(type: WidgetType): Array<RegExp> | undefined {
    return this.loadingProperties.get(type);
  }

  static getWidgetStylesheetConfigMap(widgetType: WidgetType) {
    const map = this.stylesheetConfigMap.get(widgetType);
    if (!map) {
      log.error("Widget stylesheet properties not defined: ", widgetType);
      return undefined;
    }
    return map;
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
