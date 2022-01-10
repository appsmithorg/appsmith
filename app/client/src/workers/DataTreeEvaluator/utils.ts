import { DependencyMap } from "utils/DynamicBindingUtils";
import { DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { WidgetTypeConfigMap } from "utils/WidgetFactory";

export const addDefaultAndMetaDependencyToWidget = ({
  entity,
  entityName,
  widgetConfigMap,
}: {
  entity: DataTreeWidget;
  entityName: string;
  widgetConfigMap: WidgetTypeConfigMap;
}) => {
  const dependencies: DependencyMap = {};
  // Make property dependant on the default property as any time the default changes
  // the property needs to change
  const defaultProperties = widgetConfigMap[entity.type].defaultProperties;
  Object.entries(defaultProperties).forEach(
    ([property, defaultPropertyPath]) => {
      dependencies[`${entityName}.${property}`] = [
        `${entityName}.${defaultPropertyPath}`,
        `${entityName}.meta.${property}`,
      ];
    },
  );

  const metaProperties = widgetConfigMap[entity.type].metaProperties;
  debugger;
  Object.entries(metaProperties).forEach(([property, defaultPropertyPath]) => {
    dependencies[`${entityName}.meta.${property}`] = [
      `${entityName}.${defaultPropertyPath}`,
    ];
  });
  return dependencies;
};

export const addDynamicTriggerDependencyToWidget = ({
  entity,
  entityName,
}: {
  entity: DataTreeWidget;
  entityName: string;
}) => {
  const dependencies: DependencyMap = {};
  // Adding the dynamic triggers in the dependency list as they need linting whenever updated
  // we don't make it dependent on anything else
  if (entity.dynamicTriggerPathList) {
    Object.values(entity.dynamicTriggerPathList).forEach(({ key }) => {
      dependencies[`${entityName}.${key}`] = [];
    });
  }
  return dependencies;
};
