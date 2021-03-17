import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/BaseWidget";
import WidgetFactory from "utils/WidgetFactory";
import { getAllPathsFromPropertyConfig } from "entities/Widget/utils";
import _ from "lodash";
import { DynamicPath, isDynamicValue } from "utils/DynamicBindingUtils";

export const migrateIncorrectDynamicBindingPathLists = (
  currentDSL: Readonly<ContainerWidgetProps<WidgetProps>>,
): ContainerWidgetProps<WidgetProps> => {
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
