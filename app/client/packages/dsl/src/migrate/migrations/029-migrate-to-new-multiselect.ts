import type { DSLWidget } from "../types";

export const migrateToNewMultiSelect = (currentDSL: DSLWidget) => {
  if (currentDSL.type === "DROP_DOWN_WIDGET") {
    if (currentDSL.selectionType === "MULTI_SELECT") {
      currentDSL.type = "MULTI_SELECT_WIDGET";
      delete currentDSL.isFilterable;
    }

    delete currentDSL.selectionType;
  }

  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((child: DSLWidget) =>
      migrateToNewMultiSelect(child),
    );
  }

  return currentDSL;
};
