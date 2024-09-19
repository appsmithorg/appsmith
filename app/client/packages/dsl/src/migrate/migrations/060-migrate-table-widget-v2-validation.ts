import type { DSLWidget } from "../types";

/*
 * Adds validation object to each column in the primaryColumns
 */
export const migrateTableWidgetV2Validation = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "TABLE_WIDGET_V2") {
      const primaryColumns = child.primaryColumns;

      for (const key in primaryColumns) {
        if (primaryColumns.hasOwnProperty(key)) {
          primaryColumns[key].validation = {};
        }
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateTableWidgetV2Validation(child);
    }

    return child;
  });

  return currentDSL;
};
