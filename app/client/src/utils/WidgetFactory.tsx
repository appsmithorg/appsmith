import { WidgetType, RenderMode } from "constants/WidgetConstants";
import {
  WidgetBuilder,
  WidgetProps,
  WidgetDataProps,
  WidgetState,
} from "widgets/NewBaseWidget";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "./ValidationFactory";
import React from "react";
import NewBaseWidget from "../widgets/NewBaseWidget";
import { noop } from "lodash";

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

  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return BASE_WIDGET_VALIDATION;
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getWidgetBuilder(
    type: WidgetType,
  ): WidgetBuilder<WidgetProps, WidgetState> {
    const builder = this.widgetMap.get(type);
    if (!builder) {
      const ex: WidgetCreationException = {
        message: "Widget Builder not registered for widget type" + type,
      };
      console.error(ex);
      return {
        //TODO(abhinav): Figure out if we need a null return here.
        /* eslint-disable react/display-name */

        buildWidget: () => <></>,
      };
    }
    return builder;
  }

  static registerWidgetBuilder(
    widgetType: WidgetType,
    widgetBuilder: WidgetBuilder<WidgetProps, WidgetState>,
    widgetPropertyValidation?: WidgetPropertyValidationType,
    derivedPropertiesMap?: DerivedPropertiesMap,
    triggerPropertiesMap?: TriggerPropertiesMap,
    defaultPropertiesMap?: Record<string, string>,
    metaPropertiesMap?: Record<string, any>,
  ) {
    this.widgetMap.set(widgetType, widgetBuilder);
    this.widgetPropValidationMap.set(
      widgetType,
      widgetPropertyValidation || this.getPropertyValidationMap(),
    );
    this.derivedPropertiesMap.set(
      widgetType,
      derivedPropertiesMap || this.getDerivedPropertiesMap(),
    );
    this.triggerPropertiesMap.set(
      widgetType,
      triggerPropertiesMap || this.getTriggerPropertyMap(),
    );
    this.defaultPropertiesMap.set(
      widgetType,
      defaultPropertiesMap || this.getDefaultPropertiesMap(),
    );
    this.metaPropertiesMap.set(
      widgetType,
      metaPropertiesMap || this.getMetaPropertiesMap(),
    );
  }

  static createWidget(widgetId: string): React.ReactNode {
    return <NewBaseWidget widgetId={widgetId} />;

    // // const widgetBuilder = this.widgetMap.get(widgetType);
    // if (widgetBuilder) {
    //   return <NewBaseWidget widgetId={widgetId} builder={widgetBuilder} />;
    // } else {
    //   const ex: WidgetCreationException = {
    //     message: "Widget Builder not registered for widget type" + widgetType,
    //   };
    //   console.error(ex);
    //   return null;
    // }
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
}

export interface WidgetCreationException {
  message: string;
}

export default WidgetFactory;
