import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
} from "constants/PropertyControlConstants";
import { get } from "lodash";
import type { WidgetProps } from "widgets/BaseWidget";

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

export const getPropertyPanePanelNavigationConfig = (
  config: readonly PropertyPaneConfig[],
  widgetProps: WidgetProps,
  propertyPath: string,
  panelDepth = 0,
): { index: number | undefined; path: string }[] => {
  let stack: { index: number | undefined; path: string }[] | undefined = [];

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
          });
          stack = stack.concat(
            getPropertyPanePanelNavigationConfig(
              controlConfig.panelConfig
                ?.contentChildren as readonly PropertyPaneConfig[],
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
