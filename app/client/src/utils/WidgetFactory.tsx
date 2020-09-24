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
} from "./ValidationFactory";
import React from "react";

type WidgetDerivedPropertyType = any;
export type DerivedPropertiesMap = Record<string, string>;
export type TriggerPropertiesMap = Record<string, true>;

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
  static triggerPropertiesMap: Map<
    WidgetType,
    TriggerPropertiesMap
  > = new Map();
  static defaultPropertiesMap: Map<
    WidgetType,
    Record<string, string>
  > = new Map();
  static metaPropertiesMap: Map<WidgetType, Record<string, any>> = new Map();

  static registerWidgetBuilder(
    widgetType: WidgetType,
    widgetBuilder: WidgetBuilder<WidgetProps, WidgetState>,
    widgetPropertyValidation: WidgetPropertyValidationType,
    derivedPropertiesMap: DerivedPropertiesMap,
    triggerPropertiesMap: TriggerPropertiesMap,
    defaultPropertiesMap: Record<string, string>,
    metaPropertiesMap: Record<string, any>,
  ) {
    this.widgetMap.set(widgetType, widgetBuilder);
    this.widgetPropValidationMap.set(widgetType, widgetPropertyValidation);
    this.derivedPropertiesMap.set(widgetType, derivedPropertiesMap);
    this.triggerPropertiesMap.set(widgetType, triggerPropertiesMap);
    this.defaultPropertiesMap.set(widgetType, defaultPropertiesMap);
    this.metaPropertiesMap.set(widgetType, metaPropertiesMap);
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

  static getWidgetTriggerPropertiesMap(
    widgetType: WidgetType,
  ): TriggerPropertiesMap {
    const map = this.triggerPropertiesMap.get(widgetType);
    if (!map) {
      console.error("Widget trigger map is not defined");
      return {};
    }
    return map;
  }

  static getWidgetDefaultPropertiesMap(
    widgetType: WidgetType,
  ): Record<string, string> {
    const map = this.defaultPropertiesMap.get(widgetType);
    if (!map) {
      console.error("Widget default properties not defined");
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

  static getWidgetTypeConfigMap(): WidgetTypeConfigMap {
    const typeConfigMap: WidgetTypeConfigMap = {};
    WidgetFactory.getWidgetTypes().forEach(type => {
      typeConfigMap[type] = {
        validations: WidgetFactory.getWidgetPropertyValidationMap(type),
        defaultProperties: WidgetFactory.getWidgetDefaultPropertiesMap(type),
        derivedProperties: WidgetFactory.getWidgetDerivedPropertiesMap(type),
        triggerProperties: WidgetFactory.getWidgetTriggerPropertiesMap(type),
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
    triggerProperties: TriggerPropertiesMap;
    defaultProperties: Record<string, string>;
    metaProperties: Record<string, any>;
  }
>;

export interface WidgetCreationException {
  message: string;
}

export default WidgetFactory;
