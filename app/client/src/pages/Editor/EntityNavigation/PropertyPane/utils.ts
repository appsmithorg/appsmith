import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
} from "constants/PropertyControlConstants";
import { get } from "lodash";
import type { WidgetProps } from "widgets/BaseWidget";
import type { IPanelStack } from "../types";

export const getSectionId = (
  config: readonly PropertyPaneConfig[],
  propertyPath: string,
): string | undefined => {
  for (let index = 0; index < config.length; index++) {
    const sectionChildren = config[index].children;
    if (sectionChildren) {
      for (
        let childIndex = 0;
        childIndex < sectionChildren.length;
        childIndex++
      ) {
        const controlConfig = sectionChildren[
          childIndex
        ] as PropertyPaneControlConfig;
        if (controlConfig.propertyName === propertyPath) {
          return config[index].id;
        }
      }
    }
  }
};

// Checks whether the property exists in the style config
// If not we just assume it is in the content config
export const getSelectedTabIndex = (
  // Style config
  config: readonly PropertyPaneConfig[],
  propertyPath: string,
): number => {
  const propertyName = propertyPath.split(".").slice(-1)[0];

  for (let index = 0; index < config.length; index++) {
    const sectionChildren = config[index].children;
    if (sectionChildren) {
      for (
        let childIndex = 0;
        childIndex < sectionChildren.length;
        childIndex++
      ) {
        const controlConfig = sectionChildren[
          childIndex
        ] as PropertyPaneControlConfig;
        if (controlConfig.propertyName === propertyName) {
          return 1;
        }
      }
    }
  }
  return 0;
};

export const getPropertyPanePanelNavigationConfig = (
  config: readonly PropertyPaneConfig[],
  widgetProps: WidgetProps,
  propertyPath: string,
  panelDepth = 0,
): IPanelStack[] => {
  let stack: IPanelStack[] = [];

  for (let index = 0; index < config.length; index++) {
    const sectionChildren = config[index].children;
    if (sectionChildren) {
      for (
        let childIndex = 0;
        childIndex < sectionChildren.length;
        childIndex++
      ) {
        const controlConfig = sectionChildren[
          childIndex
        ] as PropertyPaneControlConfig;
        if (
          controlConfig.propertyName ===
            propertyPath
              .split(".")
              .slice(panelDepth * 2, 1 + panelDepth * 2)
              .join(".") &&
          controlConfig.hasOwnProperty("panelConfig")
        ) {
          stack.push({
            path: `${widgetProps.widgetName}.${propertyPath
              .split(".")
              .slice(0, 1 + panelDepth * 2)
              .join(".")}`,
            index: get(
              widgetProps,
              propertyPath
                .split(".")
                .slice(0, 2 + panelDepth * 2)
                .join("."),
            )?.index,
            // style config of the panel
            // This is used later on to only parse only that panel's properties to
            // find the correct tab to switch to.
            styleChildren:
              controlConfig.panelConfig?.styleChildren ||
              controlConfig.panelConfig?.children ||
              [],
          });
          // Tab widget does not have contentChildren
          const panelConfig =
            controlConfig.panelConfig?.contentChildren ||
            controlConfig.panelConfig?.children ||
            [];
          stack = stack.concat(
            getPropertyPanePanelNavigationConfig(
              panelConfig as readonly PropertyPaneConfig[],
              widgetProps,
              propertyPath,
              panelDepth + 1,
            ),
          );
          return stack;
        }
      }
    }
  }
  return stack;
};
