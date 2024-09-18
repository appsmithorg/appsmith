import type { DSLWidget } from "../types";

const addFilterDefaultValue = (currentDSL: DSLWidget) => {
  if (currentDSL.type === "DROP_DOWN_WIDGET") {
    if (!currentDSL.hasOwnProperty("isFilterable")) {
      currentDSL.isFilterable = true;
    }
  }

  return currentDSL;
};

export const migrateFilterValueForDropDownWidget = (currentDSL: DSLWidget) => {
  const newDSL = addFilterDefaultValue(currentDSL);

  newDSL.children = newDSL.children?.map((children: DSLWidget) => {
    return migrateFilterValueForDropDownWidget(children);
  });

  return newDSL;
};
