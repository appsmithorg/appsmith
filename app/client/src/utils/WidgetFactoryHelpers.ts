import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { generateReactKey } from "./generators";
import { PropertyPaneConfigTemplates, WidgetFeatures } from "./WidgetFeatures";

// TODO(aswathkk): Cleanup all the identifiers
export function manipulateOnlyFirst(config: readonly PropertyPaneConfig[]) {
  return config.map((configItem) => {
    if ((configItem as PropertyPaneSectionConfig).sectionName) {
      const obj = {
        ...configItem,
      };
      if (configItem.children) {
        obj.children = manipulateOnlyFirst(configItem.children);
      }
      return obj;
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

// TODO(aswathkk): Cleanup all the identifiers
function manipulate(
  config: readonly PropertyPaneConfig[],
  tag: string,
): PropertyPaneConfig[] {
  return config.map((configItem) => {
    if ((configItem as PropertyPaneSectionConfig).sectionName) {
      // const sectionConfig: PropertyPaneSectionConfig = configItem as PropertyPaneSectionConfig;
      const obj = {
        ...configItem,
        collapsible: false,
        tag,
      };
      if (configItem.children) {
        obj.children = manipulate(configItem.children, tag);
      }
      return obj;
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
    ...manipulate(contentConfig, "CONTENT"),
    ...manipulate(styleConfig, "STYLE"),
  ];
}

/* This function recursively parses the property pane configuration and
   adds random hash values as `id`.

   These are generated once when the Appsmith editor is loaded,
   the resulting config is frozen and re-used during the lifecycle
   of the current browser session. See WidgetFactory
*/
export const addPropertyConfigIds = (config: PropertyPaneConfig[]) => {
  return config.map((sectionOrControlConfig: PropertyPaneConfig) => {
    sectionOrControlConfig.id = generateReactKey();
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
) {
  // Enhance property pane for dynamic height feature
  if (features && features.dynamicHeight) {
    config.splice(1, 0, PropertyPaneConfigTemplates.DYNAMIC_HEIGHT);
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
      controlConfig.validation.params.fnString = controlConfig.validation.params.fn.toString();
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
