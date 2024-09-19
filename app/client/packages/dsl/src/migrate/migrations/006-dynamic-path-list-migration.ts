import type { DSLWidget } from "../types";

export const dynamicPathListMigration = (currentDSL: DSLWidget) => {
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map(dynamicPathListMigration);
  }

  if (currentDSL.dynamicBindings) {
    currentDSL.dynamicBindingPathList = Object.keys(
      currentDSL.dynamicBindings,
    ).map((path) => ({ key: path }));
    delete currentDSL.dynamicBindings;
  }

  if (currentDSL.dynamicTriggers) {
    currentDSL.dynamicTriggerPathList = Object.keys(
      currentDSL.dynamicTriggers,
    ).map((path) => ({ key: path }));
    delete currentDSL.dynamicTriggers;
  }

  if (currentDSL.dynamicProperties) {
    currentDSL.dynamicPropertyPathList = Object.keys(
      currentDSL.dynamicProperties,
    ).map((path) => ({ key: path }));
    delete currentDSL.dynamicProperties;
  }

  return currentDSL;
};
