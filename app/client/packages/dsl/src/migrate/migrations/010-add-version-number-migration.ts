import type { DSLWidget } from "../types";

export const addVersionNumberMigration = (currentDSL: DSLWidget) => {
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map(addVersionNumberMigration);
  }

  if (currentDSL.version === undefined) {
    currentDSL.version = 1;
  }

  return currentDSL;
};
