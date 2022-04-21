import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
} from "constants/PropertyControlConstants";
import { generateReactKey } from "./generators";
import { PropertyPaneConfigTemplates, WidgetFeatures } from "./WidgetFeatures";

export const addPropertyConfigIds = (config: PropertyPaneConfig[]) => {
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

export function enhancePropertyPaneConfig(
  config: PropertyPaneConfig[],
  features?: WidgetFeatures,
) {
  if (features && features.dynamicHeight) {
    config.splice(1, 0, PropertyPaneConfigTemplates.DYNAMIC_HEIGHT);
  }
  return config;
}
