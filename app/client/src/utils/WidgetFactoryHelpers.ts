import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
} from "constants/PropertyControlConstants";
import { generateReactKey } from "./generators";
import { PropertyPaneConfigTemplates, WidgetFeatures } from "./WidgetFeatures";

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
