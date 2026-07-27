import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { memoize } from "lodash";
import log from "loglevel";
import type { WidgetType } from "./types";
import WidgetFactory from ".";
import type {
  RegisteredWidgetFeatures,
  WidgetFeatures,
} from "../../utils/WidgetFeatures";
import {
  PropertyPaneConfigTemplates,
  WidgetFeaturePropertyPaneEnhancements,
} from "../../utils/WidgetFeatures";
import { generateReactKey } from "utils/generators";
import {
  anvilWidgets,
  DEFAULT_WIDGET_ON_CANVAS_UI,
} from "widgets/wds/constants";
import type { WidgetDefaultProps } from "WidgetProvider/types";

export enum PropertyPaneConfigTypes {
  STYLE = "STYLE",
  CONTENT = "CONTENT",
}

export function addSearchConfigToPanelConfig(
  config: readonly PropertyPaneConfig[],
) {
  return config.map((configItem) => {
    if ((configItem as PropertyPaneSectionConfig).sectionName) {
      const sectionConfig = {
        ...configItem,
      };

      if (configItem.children) {
        sectionConfig.children = addSearchConfigToPanelConfig(
          configItem.children,
        );
      }

      return sectionConfig;
    } else if ((configItem as PropertyPaneControlConfig).controlType) {
      const controlConfig = configItem as PropertyPaneControlConfig;

      if (controlConfig.panelConfig) {
        return {
          ...controlConfig,
          panelConfig: {
            ...controlConfig.panelConfig,
            searchConfig: generatePropertyPaneSearchConfig(
              controlConfig.panelConfig?.contentChildren ?? [],
              controlConfig.panelConfig?.styleChildren ?? [],
            ),
          },
        };
      }

      return controlConfig;
    }

    return configItem;
  });
}

function addSearchSpecificPropertiesToConfig(
  config: readonly PropertyPaneConfig[],
  tag: string,
): PropertyPaneConfig[] {
  return config.map((configItem) => {
    if ((configItem as PropertyPaneSectionConfig).sectionName) {
      const sectionConfig = {
        ...configItem,
        collapsible: false,
        tag,
      };

      if (configItem.children) {
        sectionConfig.children = addSearchSpecificPropertiesToConfig(
          configItem.children,
          tag,
        );
      }

      return sectionConfig;
    } else if ((configItem as PropertyPaneControlConfig).controlType) {
      const controlConfig = configItem as PropertyPaneControlConfig;

      if (controlConfig.panelConfig) {
        return {
          ...controlConfig,
          panelConfig: {
            ...controlConfig.panelConfig,
            searchConfig: generatePropertyPaneSearchConfig(
              controlConfig.panelConfig?.contentChildren ?? [],
              controlConfig.panelConfig?.styleChildren ?? [],
            ),
          },
        };
      }

      return controlConfig;
    }

    return configItem;
  });
}

export function generatePropertyPaneSearchConfig(
  contentConfig: readonly PropertyPaneConfig[],
  styleConfig: readonly PropertyPaneConfig[],
) {
  return [
    ...addSearchSpecificPropertiesToConfig(contentConfig, "CONTENT"),
    ...addSearchSpecificPropertiesToConfig(styleConfig, "STYLE"),
  ];
}

/* This function recursively parses the property pane configuration and
   adds random hash values as `id`.

   These are generated once when the Appsmith editor is loaded,
   the resulting config is frozen and re-used during the lifecycle
   of the current browser session. See WidgetFactory
*/
export const addPropertyConfigIds = (
  config: PropertyPaneConfig[],
  useReactKey = true,
) => {
  return config.map((sectionOrControlConfig: PropertyPaneConfig) => {
    if (useReactKey) {
      sectionOrControlConfig.id = generateReactKey();
    } else {
      sectionOrControlConfig.id =
        (sectionOrControlConfig as PropertyPaneSectionConfig).sectionName ||
        (sectionOrControlConfig as PropertyPaneControlConfig).propertyName;
    }

    if (sectionOrControlConfig.children) {
      sectionOrControlConfig.children = addPropertyConfigIds(
        sectionOrControlConfig.children,
      );
    }

    const config = sectionOrControlConfig as PropertyPaneControlConfig;

    if (config.panelConfig) {
      if (
        config.panelConfig.children &&
        Array.isArray(config.panelConfig.children)
      ) {
        config.panelConfig.children = addPropertyConfigIds(
          config.panelConfig.children,
        );
      }

      if (
        config.panelConfig.contentChildren &&
        Array.isArray(config.panelConfig.contentChildren)
      ) {
        config.panelConfig.contentChildren = addPropertyConfigIds(
          config.panelConfig.contentChildren,
        );
      }

      if (
        config.panelConfig.styleChildren &&
        Array.isArray(config.panelConfig.styleChildren)
      ) {
        config.panelConfig.styleChildren = addPropertyConfigIds(
          config.panelConfig.styleChildren,
        );
      }

      (sectionOrControlConfig as PropertyPaneControlConfig) = config;
    }

    return sectionOrControlConfig;
  });
};

/* General function which enhances the property pane configuration

   We can use this to insert or add property configs based on widget
   features passed as the second argument.
*/
export function enhancePropertyPaneConfig(
  config: PropertyPaneConfig[],
  features?: WidgetFeatures,
  configType?: PropertyPaneConfigTypes,
  widgetType?: WidgetType,
) {
  // Enhance property pane with widget features
  // TODO(abhinav): The following "configType" check should come
  // from the features themselves.

  if (
    features &&
    (configType === undefined || configType === PropertyPaneConfigTypes.CONTENT)
  ) {
    Object.keys(features).forEach((registeredFeature: string) => {
      const { sectionIndex } =
        features[registeredFeature as RegisteredWidgetFeatures];
      const sectionName = (config[sectionIndex] as PropertyPaneSectionConfig)
        ?.sectionName;

      // This has been designed to check if the sectionIndex provided in the
      // features configuration of the widget to point to the section named "General"
      // If not, it logs an error
      // This is a sanity check, and doesn't effect the functionality of the feature
      // For consistency, we expect that all "Auto Height" property pane controls
      // be present in the "General" section of the property pane
      if (!sectionName || sectionName !== "General") {
        log.error(
          `Invalid section index for feature: ${registeredFeature} in widget: ${widgetType}`,
        );
      }

      if (
        Array.isArray(config[sectionIndex].children) &&
        PropertyPaneConfigTemplates[
          registeredFeature as RegisteredWidgetFeatures
        ]
      ) {
        config[sectionIndex].children?.push(
          ...PropertyPaneConfigTemplates[
            registeredFeature as RegisteredWidgetFeatures
          ](features[registeredFeature as RegisteredWidgetFeatures]),
        );
        config = WidgetFeaturePropertyPaneEnhancements[
          registeredFeature as RegisteredWidgetFeatures
        ](config, widgetType);
      }
    });
  }

  return config;
}

/*
  ValidationTypes.FUNCTION, allow us to configure functions within them,
  However, these are not serializable, which results in them not being able to
  be sent to the workers.
  We convert these functions to strings and delete the original function properties
  in this function

  property added `fnString`
  property deleted `fn`
*/

export function convertFunctionsToString(config: PropertyPaneConfig[]) {
  return config.map((sectionOrControlConfig: PropertyPaneConfig) => {
    const controlConfig = sectionOrControlConfig as PropertyPaneControlConfig;

    if (
      controlConfig.validation &&
      controlConfig.validation?.type === ValidationTypes.FUNCTION &&
      controlConfig.validation?.params &&
      controlConfig.validation?.params.fn
    ) {
      controlConfig.validation.params.fnString =
        controlConfig.validation.params.fn.toString();
      delete controlConfig.validation.params.fn;

      return sectionOrControlConfig;
    }

    if (sectionOrControlConfig.children) {
      sectionOrControlConfig.children = convertFunctionsToString(
        sectionOrControlConfig.children,
      );
    }

    const config = sectionOrControlConfig as PropertyPaneControlConfig;

    if (
      config.panelConfig &&
      config.panelConfig.children &&
      Array.isArray(config.panelConfig.children)
    ) {
      config.panelConfig.children = convertFunctionsToString(
        config.panelConfig.children,
      );

      (sectionOrControlConfig as PropertyPaneControlConfig) = config;
    }

    if (
      config.panelConfig &&
      config.panelConfig.contentChildren &&
      Array.isArray(config.panelConfig.contentChildren)
    ) {
      config.panelConfig.contentChildren = convertFunctionsToString(
        config.panelConfig.contentChildren,
      );

      (sectionOrControlConfig as PropertyPaneControlConfig) = config;
    }

    if (
      config.panelConfig &&
      config.panelConfig.styleChildren &&
      Array.isArray(config.panelConfig.styleChildren)
    ) {
      config.panelConfig.styleChildren = convertFunctionsToString(
        config.panelConfig.styleChildren,
      );

      (sectionOrControlConfig as PropertyPaneControlConfig) = config;
    }

    return sectionOrControlConfig;
  });
}

export const checkIsDropTarget = memoize(function isDropTarget(
  type: WidgetType,
) {
  return !!WidgetFactory.widgetConfigMap.get(type)?.isCanvas;
});

/**
 *
 * @param config The default configuration from the widget
 * @returns The default on canvas UI to be applied to widgets.
 *
 * This function takes into account the `detachFromLayout` property in the widget configuration
 * which allows widgets like Modal widget to not have a parent selection.
 *
 * This is just a failsafe, and the individual widgets must describe if they don't wan the
 * parent selection button to be available.
 *
 */
export function getDefaultOnCanvasUIConfig(config: WidgetDefaultProps) {
  return {
    ...DEFAULT_WIDGET_ON_CANVAS_UI,
    disableParentSelection: !!config.detachFromLayout,
  };
}

/* Shared platform-level `tabOrder` property pane plumbing.

   This lives here (rather than in a standalone module) so the WidgetFactory can
   compose it without introducing a new circular dependency: helpers.ts already
   imports PropertyControlConstants, WidgetValidation, ./types and
   widgets/wds/constants, so reusing them adds no new import edges.
*/

export const TAB_ORDER_PROPERTY_NAME = "tabOrder";
export const TAB_ORDER_SECTION_NAME = "Accessibility";

/**
 * Widget types that must not expose the shared `tabOrder` property:
 * internal wrappers and Anvil-only layout widgets. All WDS_* (Anvil) widgets
 * are excluded by prefix in shouldExposeTabOrderProperty.
 */
const TAB_ORDER_EXCLUDED_WIDGET_TYPES: string[] = [
  "CANVAS_WIDGET",
  "SKELETON_WIDGET",
  "TABS_MIGRATOR_WIDGET",
  anvilWidgets.SECTION_WIDGET,
  anvilWidgets.ZONE_WIDGET,
];

/**
 * Display-only widgets that have no focusable element. The platform's custom
 * Tab handler skips them at runtime, so the `tabOrder` property would be a
 * no-op — hide it to avoid confusing the builder.
 */
const TAB_ORDER_NON_FOCUSABLE_WIDGET_TYPES: string[] = [
  // both are already excluded from tabbing at runtime via NON_FOCUSABLE_WIDGET_CLASS
  "TEXT_WIDGET",
  "RATE_WIDGET",
  "IMAGE_WIDGET",
  "CHART_WIDGET",
  "MAP_CHART_WIDGET",
  "DIVIDER_WIDGET",
  "STATBOX_WIDGET",
  "DOCUMENT_VIEWER_WIDGET",
  "ICON_WIDGET",
  "PROGRESSBAR_WIDGET",
  "PROGRESS_WIDGET",
  "CIRCULAR_PROGRESS_WIDGET",
];

export function shouldExposeTabOrderProperty(type: WidgetType): boolean {
  if (!type) return false;

  if (type.startsWith("WDS_")) return false;

  if (TAB_ORDER_EXCLUDED_WIDGET_TYPES.includes(type)) return false;

  return !TAB_ORDER_NON_FOCUSABLE_WIDGET_TYPES.includes(type);
}

/**
 * Returns a fresh copy of the shared Accessibility section so that the
 * id-generation and enhancement steps in WidgetFactory never mutate an
 * object shared across widget types.
 */
export function createTabOrderPropertyPaneSection() {
  return {
    sectionName: TAB_ORDER_SECTION_NAME,
    children: [
      {
        propertyName: TAB_ORDER_PROPERTY_NAME,
        label: "Tab order",
        helpText:
          "Optional. By default, widgets are focused top to bottom, then left to right. Set a number to override this: numbered widgets come first (lowest first), then the rest in the default order. Widgets sharing the same number keep the default order between them. Leave blank to keep the default.",
        controlType: "CLEARABLE_NUMERIC_INPUT",
        placeholderText: "Auto",
        min: 1,
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.NUMBER,
          params: {
            min: 1,
            natural: true,
          },
        },
      },
    ],
  };
}

/**
 * Appends the shared Accessibility > Tab order section to a widget's property
 * pane configuration. Widgets without a property pane and excluded widget
 * types are left untouched.
 */
export function addTabOrderToPropertyPaneConfig(
  type: WidgetType,
  config: PropertyPaneConfig[],
): PropertyPaneConfig[] {
  if (!shouldExposeTabOrderProperty(type)) return config;

  if (!Array.isArray(config) || config.length === 0) return config;

  return [...config, createTabOrderPropertyPaneSection()];
}
