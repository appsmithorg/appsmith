import WidgetFactory from "utils/WidgetFactory";
import { getAllPathsFromPropertyConfig } from "entities/Widget/utils";
import _ from "lodash";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import type { DSLWidget } from "widgets/constants";

export const migrateIncorrectDynamicBindingPathLists = (
  currentDSL: Readonly<DSLWidget>,
): DSLWidget => {
  const migratedDsl = {
    ...currentDSL,
  };
  const dynamicBindingPathList: DynamicPath[] = [];
  const propertyPaneConfig = WidgetFactory.getWidgetPropertyPaneConfig(
    currentDSL.type,
  );
  const { bindingPaths } = getAllPathsFromPropertyConfig(
    currentDSL,
    propertyPaneConfig,
    {},
  );

  Object.keys(bindingPaths).forEach((bindingPath) => {
    const pathValue = _.get(migratedDsl, bindingPath);
    if (pathValue && _.isString(pathValue)) {
      if (isDynamicValue(pathValue)) {
        dynamicBindingPathList.push({ key: bindingPath });
      }
    }
  });

  migratedDsl.dynamicBindingPathList = dynamicBindingPathList;

  if (currentDSL.children) {
    migratedDsl.children = currentDSL.children.map(
      migrateIncorrectDynamicBindingPathLists,
    );
  }
  return migratedDsl;
};
