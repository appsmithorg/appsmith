import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import { get } from "lodash";
import type { WidgetProps } from "widgets/BaseWidget";
import type { IMatchedSection, IPanelStack } from "../types";
import { updateConfigPaths } from "pages/Editor/PropertyPane/helpers";

export const getSectionId = (
  config: readonly PropertyPaneConfig[],
  propertyPath: string,
): string | undefined => {
  const matchedSections: IMatchedSection[] = [];

  function _getSectionId(
    config: readonly PropertyPaneConfig[],
    rootSectionId?: string,
  ) {
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
            controlConfig.propertyName &&
            matchesPropertyPath(propertyPath, controlConfig.propertyName)
          ) {
            if (
              // The inner section might not be collapsible, so we keep track of the
              // immediate parent's section id
              (config[index] as PropertyPaneSectionConfig).collapsible === false
            ) {
              matchedSections.push({
                id: rootSectionId,
                propertyName: controlConfig.propertyName,
              });
            } else {
              matchedSections.push({
                id: config[index].id,
                propertyName: controlConfig.propertyName,
              });
            }
          } else if (controlConfig.children) {
            _getSectionId(
              controlConfig.children,
              rootSectionId ?? config[index].id,
            );
          }
        }
      } else if (
        matchesPropertyPath(
          propertyPath,
          (config[index] as PropertyPaneControlConfig).propertyName,
        )
      ) {
        matchedSections.push({
          id: rootSectionId,
          propertyName: (config[index] as PropertyPaneControlConfig)
            .propertyName,
        });
      }
    }
  }

  _getSectionId(config);

  if (!matchedSections.length) return;

  // NOTE: Might not be required
  // If the propertyPath `resetButtonStyles.boxShadow` matches with the property names
  // "boxShadow" and "resetButtonStyles.boxShadow"
  // The intendened match is "resetButtonStyles.boxShadow".
  // So we aggregrate matches and find the best match which is the longest string
  const bestMatchedSection = matchedSections.reduce(
    function (sectiona, sectionb) {
      return sectiona.propertyName.length > sectionb.propertyName.length
        ? sectiona
        : sectionb;
    },
  );

  return bestMatchedSection.id;
};

// Checks whether the property exists in the style config
// If not we just assume it is in the content config
export const getSelectedTabIndex = (
  // Style config
  config: readonly PropertyPaneConfig[],
  propertyPath: string,
): number => {
  function _getSelectedTabIndex(
    config: readonly PropertyPaneConfig[],
  ): number | undefined {
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
            matchesPropertyPath(
              propertyPath,
              controlConfig.propertyName,
              "start",
            )
          ) {
            return 1;
          } else if (controlConfig.children) {
            const index = _getSelectedTabIndex(controlConfig.children);

            // We want to continue searching if there isn't a match, so
            // we don't return/exit unless there is a match
            if (index) return index;
          }
        }
      } else if (
        matchesPropertyPath(
          propertyPath,
          (config[index] as PropertyPaneControlConfig).propertyName,
          "start",
        )
      ) {
        return 1;
      }
    }
  }

  const finalIndex = _getSelectedTabIndex(config);

  return finalIndex ?? 0;
};

// Return the panel paths we need to navigate to from the start
export const getPropertyPanePanelNavigationConfig = (
  config: readonly PropertyPaneConfig[],
  widgetProps: WidgetProps,
  propertyPath: string,
  evaluateHiddenPropertyCallback: (
    config: readonly PropertyPaneConfig[],
  ) => PropertyPaneConfig[],
): IPanelStack[] => {
  function _getNavigationConfig(
    config: readonly PropertyPaneConfig[],
    panelDepth = 0,
    rootProperty = "",
    parentPanelPath = "",
  ) {
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
          const currentProperty = controlConfig.propertyName;

          let pathList = propertyPath.split(".");

          if (panelDepth !== 0) {
            const pathWithoutRootProperty = propertyPath.replace(
              `${rootProperty}.`,
              "",
            );

            pathList = [rootProperty, ...pathWithoutRootProperty.split(".")];
          }

          if (
            matchesPropertyPath(propertyPath, currentProperty, "start") &&
            controlConfig.hasOwnProperty("panelConfig")
          ) {
            if (!rootProperty) {
              const pathWithoutRootProperty = propertyPath.replace(
                `${currentProperty}.`,
                "",
              );

              pathList = [
                currentProperty,
                ...pathWithoutRootProperty.split("."),
              ];
            }

            const panelTabPath = pathList
              .slice(0, 2 + panelDepth * 2)
              .join(".");
            const panelPath = pathList.slice(0, 1 + panelDepth * 2).join(".");
            const panelIndex = getPanelIndex(
              widgetProps,
              panelTabPath,
              panelDepth,
            );
            // We will also need the label to be sent as payload for actions to
            // set the panel, tab and section collapse state
            const panelLabel = get(widgetProps, panelTabPath)?.label;

            const newParentPanelPath = getNextParentPropertPath(
              propertyPath,
              parentPanelPath,
              currentProperty,
            );
            // Update configs with full paths
            const updatedStyleChildren = updateConfigPaths(
              controlConfig.panelConfig?.styleChildren || [],
              newParentPanelPath,
            );
            const updatedContentChildren = updateConfigPaths(
              controlConfig.panelConfig?.contentChildren ||
                controlConfig.panelConfig?.children ||
                [],
              newParentPanelPath,
            );
            const styleChildren =
              evaluateHiddenPropertyCallback(updatedStyleChildren);
            const contentChildren = evaluateHiddenPropertyCallback(
              updatedContentChildren,
            );

            stack.push({
              path: panelPath,
              index: panelIndex,
              panelLabel,
              // style config of the panel
              // This is used later on to only parse only that panel's properties to
              // find the correct tab to switch to.
              styleChildren,
              contentChildren,
            });
            // When we don't have multiple tabs we just have `children`
            const panelConfig = contentChildren;

            stack = stack.concat(
              _getNavigationConfig(
                panelConfig as readonly PropertyPaneConfig[],
                panelDepth + 1,
                rootProperty || currentProperty,
                newParentPanelPath,
              ),
            );

            return stack;
          }
        }
      }
    }

    return stack;
  }

  const finalConfig = _getNavigationConfig(config, 0);

  return finalConfig;
};

function matchesPropertyPath(
  path: string,
  propertyName: string,
  position: "start" | "end" | "full" = "end",
) {
  if (position === "end") {
    if (path.endsWith(propertyName)) {
      return true;
    }
  } else if (position === "start") {
    if (path.startsWith(propertyName)) {
      return true;
    }
  } else {
    return path === propertyName;
  }

  return false;
}

function getPanelIndex(
  widgetProps: WidgetProps,
  panelTabPath: string,
  panelDepth: number,
) {
  const obj = get(widgetProps, panelTabPath);

  // The index field never seems to change for the widget
  if (widgetProps.type === "TABLE_WIDGET_V2" && panelDepth === 0) {
    const column = panelTabPath.split(".")[1];
    const columnOrder: string[] = get(widgetProps, "columnOrder");

    return columnOrder.indexOf(column);
  }

  return obj?.index ?? obj?.position;
}

function getNextParentPropertPath(
  propertyPath: string,
  prevParentPropertyPath: string,
  currentProperty: string,
) {
  const remainingPath = propertyPath.replace(
    `${prevParentPropertyPath || currentProperty}.`,
    "",
  );
  const index = remainingPath.split(".")[0];
  const originalCurrentProperty = remainingPath.split(".")[1];

  if (!prevParentPropertyPath) {
    return `${currentProperty}.${index}`;
  }

  return `${prevParentPropertyPath}.${index}.${originalCurrentProperty}`;
}
