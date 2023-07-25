import type { DSLWidget } from "widgets/constants";
// import { isDynamicValue } from "migration-main/utils";

export const migrateIncorrectDynamicBindingPathLists = (
  currentDSL: Readonly<DSLWidget>,
): DSLWidget => {
  const migratedDsl = {
    ...currentDSL,
  };
  const dynamicBindingPathList: any[] = [];

  console.log("skip");
  // const propertyPaneConfig = WidgetFactory.getWidgetPropertyPaneConfig(
  //   currentDSL.type,
  // );
  // const { bindingPaths } = getAllPathsFromPropertyConfig(
  //   currentDSL,
  //   propertyPaneConfig,
  //   {},
  // );

  // Object.keys(bindingPaths).forEach((bindingPath) => {
  //   const pathValue = _.get(migratedDsl, bindingPath);
  //   if (pathValue && _.isString(pathValue)) {
  //     if (isDynamicValue(pathValue)) {
  //       dynamicBindingPathList.push({ key: bindingPath });
  //     }
  //   }
  // });

  migratedDsl.dynamicBindingPathList = dynamicBindingPathList;

  if (currentDSL.children) {
    migratedDsl.children = currentDSL.children.map(
      migrateIncorrectDynamicBindingPathLists,
    );
  }
  return migratedDsl;
};
