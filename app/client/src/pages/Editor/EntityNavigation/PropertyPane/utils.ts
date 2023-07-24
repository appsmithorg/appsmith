import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import { get } from "lodash";
import type { WidgetProps } from "widgets/BaseWidget";
import type { IMatchedSection, IPanelStack } from "../types";

export const getSectionId = (
  config: readonly PropertyPaneConfig[],
  propertyPath: string,
  widgetProps: WidgetProps,
): string | undefined => {
  const matchedSections: IMatchedSection[] = [];
  function _getSectionId(
    config: readonly PropertyPaneConfig[],
    propertyPath: string,
    rootSectionId?: string,
  ) {
    for (let index = 0; index < config.length; index++) {
      const sectionChildren = config[index].children;
      const _isSectionHidden = isSectionHidden(
        config[index],
        widgetProps,
        propertyPath,
      );
      // Skip searching hidden sections
      if (sectionChildren && !_isSectionHidden) {
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
              propertyPath,
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

  _getSectionId(config, propertyPath);

  if (!matchedSections.length) return;

  // If the propertyPath `resetButtonStyles.boxShadow` matches with the property names
  // "boxShadow" and "resetButtonStyles.boxShadow"
  // The intendened match is "resetButtonStyles.boxShadow".
  // So we aggregrate matches and find the best match which is the longest string
  const bestMatchedSection = matchedSections.reduce(function (
    sectiona,
    sectionb,
  ) {
    return sectiona.propertyName.length > sectionb.propertyName.length
      ? sectiona
      : sectionb;
  });

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
    propertyPath: string,
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
          if (matchesPropertyPath(propertyPath, controlConfig.propertyName)) {
            return 1;
          } else if (controlConfig.children) {
            const index = _getSelectedTabIndex(
              controlConfig.children,
              propertyPath,
            );
            // We want to continue searching if there isn't a match, so
            // we don't return/exit unless there is a match
            if (index) return index;
          }
        }
      } else if (
        matchesPropertyPath(
          propertyPath,
          (config[index] as PropertyPaneControlConfig).propertyName,
        )
      ) {
        return 1;
      }
    }
  }

  const finalIndex = _getSelectedTabIndex(config, propertyPath);
  return finalIndex ?? 0;
};

// Return the panel paths we need to navigate to from the start
export const getPropertyPanePanelNavigationConfig = (
  config: readonly PropertyPaneConfig[],
  widgetProps: WidgetProps,
  propertyPath: string,
  panelDepth = 0,
): IPanelStack[] => {
  function _getNavigationConfig(
    config: readonly PropertyPaneConfig[],
    widgetProps: WidgetProps,
    propertyPath: string,
    panelDepth = 0,
    rootProperty = "",
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
          let isMatchingPropertyName = false;
          const currentProperty = controlConfig.propertyName;

          let pathList = propertyPath.split(".");
          if (panelDepth === 0) {
            isMatchingPropertyName = matchesPropertyPath(
              propertyPath,
              currentProperty,
              "start",
            );
          } else {
            const pathWithoutRootProperty = propertyPath.replace(
              `${rootProperty}.`,
              "",
            );
            pathList = [rootProperty, ...pathWithoutRootProperty.split(".")];
            // primaryColumns.title.menuItems.menuItemneyc7dqksw.textColor
            // Every alternate path is a dynamic property not part of the property
            // pane config, these dynamic properties represent the panel id's
            // static - S exists in the property pane config, dynamic - D
            // primaryColumns.title.menuItems.menuItemneyc7dqksw.textColor
            //       S          D        S            D             S
            isMatchingPropertyName =
              pathList.slice(panelDepth * 2, 1 + panelDepth * 2).join(".") ===
              currentProperty;
          }

          if (
            isMatchingPropertyName &&
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
              isMatchingPropertyName =
                pathList.slice(panelDepth * 2, 1 + panelDepth * 2).join(".") ===
                currentProperty;
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

            stack.push({
              path: panelPath,
              index: panelIndex,
              panelLabel,
              // style config of the panel
              // This is used later on to only parse only that panel's properties to
              // find the correct tab to switch to.
              styleChildren: controlConfig.panelConfig?.styleChildren || [],
              contentChildren:
                controlConfig.panelConfig?.contentChildren ||
                controlConfig.panelConfig?.children ||
                [],
            });
            // When we don't have multiple tabs we just have `children`
            const panelConfig =
              controlConfig.panelConfig?.contentChildren ||
              controlConfig.panelConfig?.children ||
              [];
            stack = stack.concat(
              _getNavigationConfig(
                panelConfig as readonly PropertyPaneConfig[],
                widgetProps,
                propertyPath,
                panelDepth + 1,
                rootProperty || currentProperty,
              ),
            );
            return stack;
          }
        }
      }
    }
    return stack;
  }

  const finalConfig = _getNavigationConfig(
    config,
    widgetProps,
    propertyPath,
    panelDepth,
  );
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

function isSectionHidden(
  config: PropertyPaneConfig,
  widgetProps: WidgetProps,
  propertyPath: string,
) {
  if (config) {
    if (config.hidden) {
      return config.hidden(widgetProps, propertyPath);
    }
  }
  return false;
}
