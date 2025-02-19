import type {
  PropertyPaneConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { RenderMode } from "constants/WidgetConstants";
import * as log from "loglevel";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
  AutoLayoutConfig,
  CanvasWidgetStructure,
  FlattenedWidgetProps,
  WidgetConfigProps,
  WidgetDefaultProps,
  WidgetMethods,
} from "WidgetProvider/constants";
import {
  addPropertyConfigIds,
  addSearchConfigToPanelConfig,
  convertFunctionsToString,
  enhancePropertyPaneConfig,
  generatePropertyPaneSearchConfig,
  getDefaultOnCanvasUIConfig,
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
import type { SetterConfig } from "entities/AppTheming";
import { freeze, memoize } from "./decorators";
import { create } from "mutative";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type {
  CopiedWidgetData,
  PasteDestinationInfo,
} from "layoutSystems/anvil/utils/paste/types";
import { call } from "redux-saga/effects";
import type { DerivedPropertiesMap } from "./types";

// exporting it as well so that existing imports are not affected
// TODO: remove this once all imports are updated
export type { DerivedPropertiesMap };

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WidgetDerivedPropertyType = any;

export type WidgetType = (typeof WidgetFactory.widgetTypes)[number];

class WidgetFactory {
  static widgetTypes: Record<string, string> = {};

  static widgetConfigMap: Map<
    WidgetType,
    Partial<WidgetProps> & WidgetConfigProps & { type: string }
  > = new Map();

  static widgetDefaultPropertiesMap: Map<string, Record<string, unknown>> =
    new Map();

  static widgetsMap: Map<WidgetType, typeof BaseWidget> = new Map();

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static widgetBuilderMap: Map<WidgetType, any> = new Map();

  static initialize(
    widgets: [
      typeof BaseWidget,
      (widgetProps: CanvasWidgetStructure) => React.ReactNode,
    ][],
  ) {
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
    const defaultConfig: WidgetDefaultProps = widget.getDefaults();
    const config = widget.getConfig();

    /**
     * As this will make all layout system widgets have these properties.
     * We're going to prioritise #21825.
     * This will prevent the DSLs which are persisted from being polluted and overly large.
     *
     * The following makes sure that the on canvas ui configurations are picked up from widgets
     * and added to the WidgetFactory, such that these are accessible when needed in the applcation.
     */
    const onCanvasUI =
      config.onCanvasUI || getDefaultOnCanvasUIConfig(defaultConfig);

    const { IconCmp } = widget.getMethods();
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
      hideCard: !!config.hideCard || !(config.iconSVG || IconCmp),
      isDeprecated: !!config.isDeprecated,
      replacement: config.replacement,
      displayName: config.name,
      displayOrder: config.displayOrder,
      key: generateReactKey(),
      iconSVG: config.iconSVG,
      thumbnailSVG: config.thumbnailSVG,
      isCanvas: config.isCanvas,
      needsHeightForContent: config.needsHeightForContent,
      isSearchWildcard: config.isSearchWildcard,
      needsErrorInfo: !!config.needsErrorInfo,
      onCanvasUI,
    };

    // When adding widgets to canvas in Anvil, we don't need all of configured properties
    // (See _config object)
    // and that should ideally be the case for Fixed mode widgets as well
    // So, creating this map to use in WidgetAdditionSagas for both Fixed
    // and Anvil.
    // Before this we were using "ALL" configured properties when creating
    // the newly added widget. This lead to many extra properties being added
    // to the DSL
    WidgetFactory.widgetDefaultPropertiesMap.set(
      widget.type,
      Object.freeze({ ...defaultConfig }),
    );
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

  static getConfigs = () => {
    return Object.fromEntries(WidgetFactory.widgetConfigMap);
  };

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

  @memoize
  @freeze
  static getWidgetTypes(): WidgetType[] {
    return Array.from(WidgetFactory.widgetsMap.keys());
  }

  @memoize
  @freeze
  static getWidgetDerivedPropertiesMap(
    widgetType: WidgetType,
  ): DerivedPropertiesMap {
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
  }

  @memoize
  @freeze
  static getWidgetDefaultPropertiesMap(
    widgetType: WidgetType,
  ): Record<string, string> {
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
  }

  @memoize
  @freeze
  static getWidgetDependencyMap(
    widgetType: WidgetType,
  ): Record<string, string[]> {
    const widget = WidgetFactory.widgetsMap.get(widgetType);

    const dependencyMap = widget?.getDependencyMap();

    if (dependencyMap) {
      return dependencyMap;
    } else {
      log.error(`Dependency map is defined for widget type: ${widgetType}`);

      return {};
    }
  }

  @memoize
  @freeze
  static getWidgetMetaPropertiesMap(
    widgetType: WidgetType,
  ): Record<string, unknown> {
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
  }

  @memoize
  @freeze
  static getWidgetPropertyPaneCombinedConfig(
    type: WidgetType,
    widgetProperties: WidgetProps,
  ): readonly PropertyPaneConfig[] {
    const contentConfig = WidgetFactory.getWidgetPropertyPaneContentConfig(
      type,
      widgetProperties,
    );
    const styleConfig = WidgetFactory.getWidgetPropertyPaneStyleConfig(type);

    return [...contentConfig, ...styleConfig];
  }

  @memoize
  @freeze
  private static getWidgetPropertyPaneConfigWithMemo(type: WidgetType) {
    const widget = WidgetFactory.widgetsMap.get(type);

    const propertyPaneConfig = widget?.getPropertyPaneConfig();

    const features = widget?.getFeatures();

    if (Array.isArray(propertyPaneConfig) && propertyPaneConfig.length > 0) {
      const enhance = flow([
        enhancePropertyPaneConfig,
        convertFunctionsToString,
        addPropertyConfigIds,
      ]);
      const enhancedPropertyPaneConfig = enhance(propertyPaneConfig, features);

      return enhancedPropertyPaneConfig;
    }
  }

  @memoize
  static getWidgetPropertyPaneConfig(
    type: WidgetType,
    widgetProperties: WidgetProps,
  ): readonly PropertyPaneConfig[] {
    const propertyPaneConfig =
      WidgetFactory.getWidgetPropertyPaneConfigWithMemo(type);

    if (Array.isArray(propertyPaneConfig) && propertyPaneConfig.length > 0) {
      return propertyPaneConfig;
    } else {
      const config = WidgetFactory.getWidgetPropertyPaneCombinedConfig(
        type,
        widgetProperties,
      );

      if (config === undefined) {
        log.error("Widget property pane config not defined", type);

        return [];
      } else {
        return config;
      }
    }
  }

  @memoize
  private static getWidgetPropertyPaneContentConfigWithDynamicPropertyGenerator(
    type: WidgetType,
  ) {
    const widget = WidgetFactory.widgetsMap.get(type);

    const propertyPaneContentConfig = widget?.getPropertyPaneContentConfig();

    const features = widget?.getFeatures();

    if (propertyPaneContentConfig) {
      const enhance = flow([
        enhancePropertyPaneConfig,
        convertFunctionsToString,
        addPropertyConfigIds,
        addSearchConfigToPanelConfig,
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
  }

  @memoize
  @freeze
  static getWidgetPropertyPaneContentConfig(
    type: WidgetType,
    widgetProperties: WidgetProps,
  ): readonly PropertyPaneConfig[] {
    const propertyPaneContentConfigWithDynamicPropertyGenerator: PropertyPaneSectionConfig[] =
      WidgetFactory.getWidgetPropertyPaneContentConfigWithDynamicPropertyGenerator(
        type,
      );

    if (
      propertyPaneContentConfigWithDynamicPropertyGenerator.some(
        (d) => d.hasDynamicProperties,
      )
    ) {
      return propertyPaneContentConfigWithDynamicPropertyGenerator.map(
        (section: PropertyPaneSectionConfig) => {
          if (section.hasDynamicProperties) {
            const dynamicProperties =
              section.generateDynamicProperties?.(widgetProperties);

            if (dynamicProperties && dynamicProperties.length) {
              addPropertyConfigIds(dynamicProperties, false);
              section = create(section, (draft) => {
                draft.children = [...dynamicProperties, ...section.children];
              });
            }
          }

          return section;
        },
      );
    } else {
      return propertyPaneContentConfigWithDynamicPropertyGenerator;
    }
  }

  @memoize
  @freeze
  static getWidgetPropertyPaneStyleConfig(
    type: WidgetType,
  ): readonly PropertyPaneConfig[] {
    const widget = WidgetFactory.widgetsMap.get(type);

    const propertyPaneStyleConfig = widget?.getPropertyPaneStyleConfig();

    const features = widget?.getFeatures();

    if (propertyPaneStyleConfig) {
      const enhance = flow([
        enhancePropertyPaneConfig,
        convertFunctionsToString,
        addPropertyConfigIds,
        addSearchConfigToPanelConfig,
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
  }

  @memoize
  @freeze
  static getWidgetPropertyPaneSearchConfig(
    type: WidgetType,
    widgetProperties: WidgetProps,
  ): readonly PropertyPaneConfig[] {
    const config = generatePropertyPaneSearchConfig(
      WidgetFactory.getWidgetPropertyPaneContentConfig(type, widgetProperties),
      WidgetFactory.getWidgetPropertyPaneStyleConfig(type),
    );

    if (config) {
      return config;
    } else {
      return [];
    }
  }

  @memoize
  @freeze
  static getWidgetAutoLayoutConfig(type: WidgetType): AutoLayoutConfig {
    // we don't need AutoLayoutConfig config for WDS widgets
    if (type?.includes("WDS")) return {};

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
        disabledPropsDefaults: baseAutoLayoutConfig.disabledPropsDefaults ?? {},
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
  }

  @memoize
  @freeze
  static getWidgetAnvilConfig(type: WidgetType): AnvilConfig {
    const widget = WidgetFactory.widgetsMap.get(type);
    const baseAnvilConfig: AnvilConfig | null | undefined =
      widget?.getAnvilConfig();

    if (!baseAnvilConfig) {
      log.error(`Anvil config is not defined for widget type: ${type}`);

      return {
        isLargeWidget: false,
        widgetSize: {},
      };
    }

    return baseAnvilConfig;
  }

  @memoize
  @freeze
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

  static getAutocompleteDefinitions(
    type: WidgetType,
  ): AutocompletionDefinitions {
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
  }

  @memoize
  @freeze
  static getWidgetSetterConfig(type: WidgetType): Partial<SetterConfig> {
    const widget = WidgetFactory.widgetsMap.get(type);

    const setterConfig = widget?.getSetterConfig() || {};

    return setterConfig;
  }

  @memoize
  @freeze
  static getLoadingProperties(type: WidgetType): Array<RegExp> | undefined {
    const widget = WidgetFactory.widgetsMap.get(type);

    return widget?.getLoadingProperties();
  }

  @memoize
  @freeze
  static getWidgetStylesheetConfigMap(widgetType: WidgetType) {
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
  }

  @memoize
  static getWidgetMethods(type: WidgetType): WidgetMethods {
    const widget = WidgetFactory.widgetsMap.get(type);

    const methods = widget?.getMethods();

    if (methods) {
      return methods;
    } else {
      return {};
    }
  }

  @memoize
  static performPasteOperationChecks(
    allWidgets: CanvasWidgetsReduxState,
    oldWidget: FlattenedWidgetProps,
    newWidget: FlattenedWidgetProps,
    widgetIdMap: Record<string, string>,
  ): FlattenedWidgetProps {
    const widget = WidgetFactory.widgetsMap.get(newWidget.type);

    if (!widget) return newWidget;

    const widgetProps: FlattenedWidgetProps | null =
      widget?.pasteOperationChecks(
        allWidgets,
        oldWidget,
        newWidget,
        widgetIdMap,
      );

    return widgetProps !== null ? widgetProps : newWidget;
  }

  @memoize
  static *performPasteOperation(
    allWidgets: CanvasWidgetsReduxState, // All widgets
    copiedWidgets: CopiedWidgetData[], // Original copied widgets
    destinationInfo: PasteDestinationInfo, // Destination info of copied widgets
    widgetIdMap: Record<string, string>, // Map of oldWidgetId -> newWidgetId
    reverseWidgetIdMap: Record<string, string>, // Map of newWidgetId -> oldWidgetId
  ) {
    const { parentOrder } = destinationInfo;
    const parent: FlattenedWidgetProps =
      allWidgets[parentOrder[parentOrder.length - 1]];
    const widget = WidgetFactory.widgetsMap.get(parent.type);

    if (!widget) return allWidgets;

    const res: CanvasWidgetsReduxState = yield call(
      widget?.performPasteOperation,
      allWidgets,
      copiedWidgets,
      destinationInfo,
      widgetIdMap,
      reverseWidgetIdMap,
    );

    return res;
  }
}

export type WidgetTypeConfigMap = Record<
  string,
  {
    defaultProperties: Record<string, string>;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metaProperties: Record<string, any>;
    derivedProperties: WidgetDerivedPropertyType;
  }
>;

export interface WidgetCreationException {
  message: string;
}

export default WidgetFactory;
