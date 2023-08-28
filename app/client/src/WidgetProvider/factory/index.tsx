import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { RenderMode } from "constants/WidgetConstants";
import * as log from "loglevel";
import type {
  AutocompletionDefinitions,
  AutoLayoutConfig,
  CanvasWidgetStructure,
  WidgetConfigProps,
  WidgetMethods,
} from "WidgetProvider/constants";
import {
  addPropertyConfigIds,
  addSearchConfigToPanelConfig,
  convertFunctionsToString,
  enhancePropertyPaneConfig,
  generatePropertyPaneSearchConfig,
  PropertyPaneConfigTypes,
} from "./helpers";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import type BaseWidget from "widgets/BaseWidget";
import { flow } from "lodash";
import { generateReactKey } from "utils/generators";
import {
  WidgetFeaturePropertyEnhancements,
  WidgetFeatureProps,
} from "../../utils/WidgetFeatures";
import type { RegisteredWidgetFeatures } from "../../utils/WidgetFeatures";
import memo from "micro-memoize";
// import { WIDGETS_COUNT } from "widgets";
import type { SetterConfig } from "entities/AppTheming";

type WidgetDerivedPropertyType = any;
export type DerivedPropertiesMap = Record<string, string>;
export type WidgetType = (typeof WidgetFactory.widgetTypes)[number];

function memoize<T>(fn: (...arg: any[]) => T) {
  return memo(fn, {
    maxSize: 100,
  });
}

class WidgetFactory {
  static widgetTypes: Record<string, string> = {};

  static widgetConfigMap: Map<
    WidgetType,
    Partial<WidgetProps> & WidgetConfigProps & { type: string }
  > = new Map();

  static widgetsMap: Map<WidgetType, typeof BaseWidget> = new Map();

  static widgetBuilderMap: Map<WidgetType, any> = new Map();

  static initialize(widgets: (typeof BaseWidget | any)[]) {
    const start = performance.now();

    for (const [widget, builder] of widgets) {
      WidgetFactory.widgetsMap.set(widget.type, widget);

      WidgetFactory.widgetTypes[widget.type] = widget.type;

      WidgetFactory.widgetBuilderMap.set(widget.type, builder);

      WidgetFactory.configureWidget(widget);
    }

    log.debug("Widget registration took: ", performance.now() - start, "ms");
  }

  private static configureWidget(widget: typeof BaseWidget) {
    const config = widget.getConfig();

    const features = widget.getFeatures();

    let enhancedFeatures: Record<string, unknown> = {};

    if (features) {
      Object.keys(features).forEach((registeredFeature: string) => {
        enhancedFeatures = Object.assign(
          {},
          WidgetFeatureProps[registeredFeature as RegisteredWidgetFeatures],
          WidgetFeaturePropertyEnhancements[
            registeredFeature as RegisteredWidgetFeatures
          ](widget),
        );
      });
    }

    const _config = {
      type: widget.type,
      ...widget.getDefaults(),
      ...enhancedFeatures,
      searchTags: config.searchTags,
      tags: config.tags,
      hideCard: !!config.hideCard || !config.iconSVG,
      isDeprecated: !!config.isDeprecated,
      replacement: config.replacement,
      displayName: config.name,
      key: generateReactKey(),
      iconSVG: config.iconSVG,
      isCanvas: config.isCanvas,
      needsHeightForContent: config.needsHeightForContent,
    };

    WidgetFactory.widgetConfigMap.set(widget.type, Object.freeze(_config));
  }

  static get(type: WidgetType) {
    const widget = WidgetFactory.widgetsMap.get(type);

    if (widget) {
      return widget;
    } else {
      log.error(`Widget is not defined with type: ${type}`);

      return;
    }
  }

  static getConfig(type: WidgetType) {
    const config = WidgetFactory.widgetConfigMap.get(type);

    if (config) {
      return config;
    } else {
      log.error(`Widget config is not registered for type: ${type}`);

      return;
    }
  }

  static getConfigs = memoize(() => {
    return Object.fromEntries(WidgetFactory.widgetConfigMap);
  });

  static createWidget(
    widgetData: CanvasWidgetStructure,
    renderMode: RenderMode,
  ): React.ReactNode {
    const { type } = widgetData;

    const builder = WidgetFactory.widgetBuilderMap.get(type);

    if (builder) {
      const widgetProps = {
        key: widgetData.widgetId,
        isVisible: true,
        ...widgetData,
        renderMode,
      };

      return builder(widgetProps);
    } else {
      const ex: WidgetCreationException = {
        message:
          "Widget Builder not registered for widget type" + widgetData.type,
      };
      log.error(ex);
      return null;
    }
  }

  static getWidgetTypes = memoize((): WidgetType[] => {
    return Array.from(WidgetFactory.widgetsMap.keys());
  });

  static getWidgetDerivedPropertiesMap = memoize(
    (widgetType: WidgetType): DerivedPropertiesMap => {
      const widget = WidgetFactory.widgetsMap.get(widgetType);

      const derivedProperties = widget?.getDerivedPropertiesMap();

      if (derivedProperties) {
        return derivedProperties;
      } else {
        log.error(
          `Derived properties are not defined for widget type: ${widgetType}`,
        );

        return {};
      }
    },
  );

  static getWidgetDefaultPropertiesMap = memoize(
    (widgetType: WidgetType): Record<string, string> => {
      const widget = WidgetFactory.widgetsMap.get(widgetType);

      const defaultProperties = widget?.getDefaultPropertiesMap();

      if (defaultProperties) {
        return defaultProperties;
      } else {
        log.error(
          `Default properties are not defined for widget type: ${widgetType}`,
        );
        return {};
      }
    },
  );

  static getWidgetMetaPropertiesMap = memoize(
    (widgetType: WidgetType): Record<string, unknown> => {
      const widget = WidgetFactory.widgetsMap.get(widgetType);

      const metaProperties = widget?.getMetaPropertiesMap();

      if (metaProperties) {
        return metaProperties;
      } else {
        log.error(
          `Meta properties are not defined for widget type: ${widgetType}`,
        );
        return {};
      }
    },
  );

  static getWidgetPropertyPaneCombinedConfig = memoize(
    (type: WidgetType): readonly PropertyPaneConfig[] => {
      const contentConfig =
        WidgetFactory.getWidgetPropertyPaneContentConfig(type);
      const styleConfig = WidgetFactory.getWidgetPropertyPaneStyleConfig(type);
      return [...contentConfig, ...styleConfig];
    },
  );

  static getWidgetPropertyPaneConfig = memoize(
    (type: WidgetType): readonly PropertyPaneConfig[] => {
      const widget = WidgetFactory.widgetsMap.get(type);

      const propertyPaneConfig = widget?.getPropertyPaneConfig();

      const features = widget?.getFeatures();

      if (Array.isArray(propertyPaneConfig) && propertyPaneConfig.length > 0) {
        const enhance = flow([
          enhancePropertyPaneConfig,
          convertFunctionsToString,
          addPropertyConfigIds,
          Object.freeze,
        ]);
        const enhancedPropertyPaneConfig = enhance(
          propertyPaneConfig,
          features,
        );

        return enhancedPropertyPaneConfig;
      } else {
        const config = WidgetFactory.getWidgetPropertyPaneCombinedConfig(type);

        if (config === undefined) {
          log.error("Widget property pane config not defined", type);
          return [];
        } else {
          return config;
        }
      }
    },
  );

  static getWidgetPropertyPaneContentConfig = memoize(
    (type: WidgetType): readonly PropertyPaneConfig[] => {
      const widget = WidgetFactory.widgetsMap.get(type);

      const propertyPaneContentConfig = widget?.getPropertyPaneContentConfig();

      const features = widget?.getFeatures();

      if (propertyPaneContentConfig) {
        const enhance = flow([
          enhancePropertyPaneConfig,
          convertFunctionsToString,
          addPropertyConfigIds,
          addSearchConfigToPanelConfig,
          Object.freeze,
        ]);

        const enhancedPropertyPaneContentConfig = enhance(
          propertyPaneContentConfig,
          features,
          PropertyPaneConfigTypes.CONTENT,
          type,
        );

        return enhancedPropertyPaneContentConfig;
      } else {
        return [];
      }
    },
  );

  static getWidgetPropertyPaneStyleConfig = memoize(
    (type: WidgetType): readonly PropertyPaneConfig[] => {
      const widget = WidgetFactory.widgetsMap.get(type);

      const propertyPaneStyleConfig = widget?.getPropertyPaneStyleConfig();

      const features = widget?.getFeatures();

      if (propertyPaneStyleConfig) {
        const enhance = flow([
          enhancePropertyPaneConfig,
          convertFunctionsToString,
          addPropertyConfigIds,
          addSearchConfigToPanelConfig,
          Object.freeze,
        ]);

        const enhancedPropertyPaneConfig = enhance(
          propertyPaneStyleConfig,
          features,
          PropertyPaneConfigTypes.STYLE,
        );

        return enhancedPropertyPaneConfig;
      } else {
        return [];
      }
    },
  );

  static getWidgetPropertyPaneSearchConfig = memoize(
    (type: WidgetType): readonly PropertyPaneConfig[] => {
      const config = generatePropertyPaneSearchConfig(
        WidgetFactory.getWidgetPropertyPaneContentConfig(type),
        WidgetFactory.getWidgetPropertyPaneStyleConfig(type),
      );

      if (config) {
        return config;
      } else {
        return [];
      }
    },
  );

  static getWidgetAutoLayoutConfig = memoize(
    (type: WidgetType): AutoLayoutConfig => {
      const widget = WidgetFactory.widgetsMap.get(type);

      const baseAutoLayoutConfig = widget?.getAutoLayoutConfig();

      if (baseAutoLayoutConfig) {
        return {
          ...baseAutoLayoutConfig,
          widgetSize:
            baseAutoLayoutConfig.widgetSize?.map((sizeConfig) => ({
              ...sizeConfig,
              configuration: (props: WidgetProps) => {
                if (!props)
                  return {
                    minWidth:
                      WidgetFactory.widgetConfigMap.get(type)?.minWidth ||
                      FILL_WIDGET_MIN_WIDTH,
                    minHeight:
                      WidgetFactory.widgetConfigMap.get(type)?.minHeight || 80,
                  };
                return sizeConfig.configuration(props);
              },
            })) || [],
          autoDimension: baseAutoLayoutConfig.autoDimension ?? {},
          disabledPropsDefaults:
            baseAutoLayoutConfig.disabledPropsDefaults ?? {},
        };
      } else {
        log.error(`Auto layout config is not defined for widget type: ${type}`);
        return {
          autoDimension: {},
          widgetSize: [],
          disableResizeHandles: {},
          disabledPropsDefaults: {},
        };
      }
    },
  );

  static getWidgetTypeConfigMap = memoize((): WidgetTypeConfigMap => {
    const typeConfigMap: WidgetTypeConfigMap = {};
    WidgetFactory.getWidgetTypes().forEach((type) => {
      typeConfigMap[type] = {
        defaultProperties: WidgetFactory.getWidgetDefaultPropertiesMap(type),
        derivedProperties: WidgetFactory.getWidgetDerivedPropertiesMap(type),
        metaProperties: WidgetFactory.getWidgetMetaPropertiesMap(type),
      };
    });
    return typeConfigMap;
  });

  static getAutocompleteDefinitions = memoize(
    (type: WidgetType): AutocompletionDefinitions => {
      const widget = WidgetFactory.widgetsMap.get(type);

      const autocompleteDefinition = widget?.getAutocompleteDefinitions();

      if (autocompleteDefinition) {
        return autocompleteDefinition;
      } else {
        log.error(
          `Auto complete definitions are not defined for widget type: ${type}`,
        );
        return {};
      }
    },
  );

  static getWidgetSetterConfig = memoize(
    (type: WidgetType): Partial<SetterConfig> => {
      const widget = WidgetFactory.widgetsMap.get(type);

      const setterConfig = widget?.getSetterConfig() || {};

      return setterConfig;
    },
  );

  static getLoadingProperties = memoize(
    (type: WidgetType): Array<RegExp> | undefined => {
      const widget = WidgetFactory.widgetsMap.get(type);

      return widget?.getLoadingProperties();
    },
  );

  static getWidgetStylesheetConfigMap = memoize((widgetType: WidgetType) => {
    const widget = WidgetFactory.widgetsMap.get(widgetType);

    const stylesheet = widget?.getStylesheetConfig();

    if (stylesheet) {
      return stylesheet;
    } else {
      log.error(
        `stylesheet config is not defined for widget type: ${widgetType}`,
      );
      return undefined;
    }
  });

  static getWidgetMethods = memoize((type: WidgetType): WidgetMethods => {
    const widget = WidgetFactory.widgetsMap.get(type);

    const methods = widget?.getMethods();

    if (methods) {
      return methods;
    } else {
      return {};
    }
  });
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
