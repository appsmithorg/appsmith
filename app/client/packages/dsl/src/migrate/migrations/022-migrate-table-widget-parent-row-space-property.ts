import type { DSLWidget } from "../types";

export const migrateTableWidgetParentRowSpaceProperty = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "TABLE_WIDGET") {
      if (child.parentRowSpace === 40) {
        child.parentRowSpace = 10; //GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateTableWidgetParentRowSpaceProperty(child);
    }

    return child;
  });

  return currentDSL;
};
