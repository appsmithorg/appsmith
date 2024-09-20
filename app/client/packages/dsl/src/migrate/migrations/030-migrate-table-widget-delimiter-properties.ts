import type { DSLWidget } from "../types";

export const migrateTableWidgetDelimiterProperties = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "TABLE_WIDGET") {
      if (!child.delimiter) {
        child.delimiter = ",";
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateTableWidgetDelimiterProperties(child);
    }

    return child;
  });

  return currentDSL;
};
