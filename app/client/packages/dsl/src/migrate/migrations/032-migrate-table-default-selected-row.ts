import type { DSLWidget } from "../types";

export const migrateTableDefaultSelectedRow = (currentDSL: DSLWidget) => {
  if (currentDSL.type === "TABLE_WIDGET") {
    if (!currentDSL.defaultSelectedRow) currentDSL.defaultSelectedRow = "0";
  }

  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((child: DSLWidget) =>
      migrateTableDefaultSelectedRow(child),
    );
  }

  return currentDSL;
};
